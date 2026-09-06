const mongoose = require("mongoose");
const Payrun = require("../models/Payrun");
const Payslip = require("../models/Payslip");
const Employee = require("../models/Employee");
const SalaryStructure = require("../models/SalaryStructure");
const SalaryRule = require("../models/SalaryRule");
const Attendance = require("../models/Attendance");
const TimeOffRequest = require("../models/TimeOffRequest");
const contractService = require("./contract.service");
const formulaEngine = require("./formulaEngine.service");
require("../models/Department");
require("../models/JobPosition");
require("../models/WorkingSchedule");
require("../models/User");

/**
 * Normalizes date to midnight UTC
 */
const normalizeDate = (d) => {
  const dateObj = new Date(d);
  return new Date(
    Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate())
  );
};

const getDayName = (date) => {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[new Date(date).getUTCDay()];
};

/**
 * Counts total scheduled working days in a date range for an employee
 */
const countWorkingDaysInPeriod = (workingSchedule, periodStart, periodEnd) => {
  const sDate = normalizeDate(periodStart);
  const eDate = normalizeDate(periodEnd);

  let scheduledDaysSet = new Set(["monday", "tuesday", "wednesday", "thursday", "friday"]);
  if (workingSchedule && Array.isArray(workingSchedule.days) && workingSchedule.days.length > 0) {
    scheduledDaysSet = new Set(
      workingSchedule.days.filter((d) => d.day).map((d) => d.day.toLowerCase())
    );
  }

  let count = 0;
  const curr = new Date(sDate);
  while (curr <= eDate) {
    const dayName = getDayName(curr).toLowerCase();
    if (scheduledDaysSet.has(dayName)) {
      count++;
    }
    curr.setUTCDate(curr.getUTCDate() + 1);
  }

  return count;
};

/**
 * Step 1 / 2 Wizard: Queries candidate employees annotated with contract resolution
 */
exports.getEligibleEmployees = async (query = {}) => {
  const { periodStart, periodEnd, department, employeeType } = query;

  if (!periodStart || !periodEnd) {
    const err = new Error("periodStart and periodEnd are required");
    err.statusCode = 400;
    throw err;
  }

  const filter = { status: "Active" };
  if (department) filter.department = department;
  if (employeeType && employeeType !== "All") filter.employeeType = employeeType;

  const employees = await Employee.find(filter)
    .populate("department")
    .populate("jobPosition")
    .populate("workingSchedule");

  const candidates = await Promise.all(
    employees.map(async (emp) => {
      const resolution = await contractService.resolveApplicableContract(
        emp._id,
        periodStart,
        periodEnd
      );
      return {
        employee: emp,
        contract: resolution.contract,
        issue: resolution.issue,
      };
    })
  );

  return candidates;
};

/**
 * Create Payrun and initialize Draft Payslips
 */
exports.createPayrun = async (data, authorUserId) => {
  const { salaryStructure, periodStart, periodEnd, selectedEmployees } = data;

  if (!salaryStructure || !periodStart || !periodEnd || !Array.isArray(selectedEmployees) || selectedEmployees.length === 0) {
    const err = new Error("Validation Error: salaryStructure, periodStart, periodEnd, and selectedEmployees are required");
    err.statusCode = 400;
    throw err;
  }

  const pStart = normalizeDate(periodStart);
  const pEnd = normalizeDate(periodEnd);

  if (pStart > pEnd) {
    const err = new Error("periodStart cannot be after periodEnd");
    err.statusCode = 400;
    throw err;
  }

  const structure = await SalaryStructure.findById(salaryStructure);
  if (!structure) {
    const err = new Error("Salary structure not found");
    err.statusCode = 404;
    throw err;
  }

  const yearMonth = `${pStart.getUTCFullYear()}-${String(pStart.getUTCMonth() + 1).padStart(2, "0")}`;
  const name = data.name || `Payrun ${yearMonth} (${structure.name})`;

  const payrun = new Payrun({
    name,
    salaryStructure,
    periodStart: pStart,
    periodEnd: pEnd,
    employeeType: data.employeeType || "All",
    department: data.department || null,
    selectedEmployees,
    status: "Draft",
    createdBy: authorUserId || null,
  });

  await payrun.save();

  // Create Draft Payslips
  const payslips = [];
  for (const empId of selectedEmployees) {
    const resolution = await contractService.resolveApplicableContract(empId, pStart, pEnd);
    const warnings = [];

    if (resolution.issue === "NO_CONTRACT") {
      warnings.push("No active contract for this period");
    } else if (resolution.issue === "CONTRACT_PERIOD_MISMATCH") {
      warnings.push("Contract changed mid-period — payroll period is not fully covered by a single contract");
    }

    const payslip = new Payslip({
      payrun: payrun._id,
      employee: empId,
      contract: resolution.contract ? resolution.contract._id : null,
      salaryStructure,
      periodStart: pStart,
      periodEnd: pEnd,
      status: "Draft",
      warnings,
    });

    await payslip.save();
    payslips.push(payslip);
  }

  return { payrun, payslips };
};

/**
 * Compute Payrun: executes payroll formula engine across all member payslips
 */
exports.computePayrun = async (payrunId) => {
  const payrun = await Payrun.findById(payrunId);
  if (!payrun) {
    const err = new Error("Payrun not found");
    err.statusCode = 404;
    throw err;
  }

  if (payrun.status === "Validated" || payrun.status === "Paid") {
    const err = new Error(`Cannot recompute a payrun with status '${payrun.status}'`);
    err.statusCode = 400;
    throw err;
  }

  const salaryStructure = await SalaryStructure.findById(payrun.salaryStructure).populate("rules");
  if (!salaryStructure) {
    const err = new Error("Salary structure not found");
    err.statusCode = 404;
    throw err;
  }

  const payslips = await Payslip.find({ payrun: payrun._id }).populate({
    path: "employee",
    populate: { path: "workingSchedule" },
  });

  const allPayrunWarnings = new Set();

  for (const payslip of payslips) {
    const emp = payslip.employee;
    if (!emp) continue;

    // Check if contract-level issue blocks computation
    const resolution = await contractService.resolveApplicableContract(
      emp._id,
      payrun.periodStart,
      payrun.periodEnd
    );

    const warnings = [];

    if (resolution.issue === "NO_CONTRACT") {
      warnings.push("No active contract for this period");
      payslip.warnings = warnings;
      payslip.status = "Computed";
      payslip.lines = [];
      payslip.grossSalary = 0;
      payslip.totalDeductions = 0;
      payslip.netSalary = 0;
      await payslip.save();
      warnings.forEach((w) => allPayrunWarnings.add(`${emp.fullName}: ${w}`));
      continue;
    }

    if (resolution.issue === "CONTRACT_PERIOD_MISMATCH") {
      warnings.push("Contract changed mid-period — payroll period is not fully covered by a single contract");
      payslip.warnings = warnings;
      payslip.status = "Computed";
      payslip.lines = [];
      payslip.grossSalary = 0;
      payslip.totalDeductions = 0;
      payslip.netSalary = 0;
      await payslip.save();
      warnings.forEach((w) => allPayrunWarnings.add(`${emp.fullName}: ${w}`));
      continue;
    }

    const contract = resolution.contract;
    payslip.contract = contract._id;

    // 1. Gather Schedule & Attendance
    const workingSchedule = contract.workingSchedule || emp.workingSchedule;
    const totalWorkingDays = countWorkingDaysInPeriod(
      workingSchedule,
      payrun.periodStart,
      payrun.periodEnd
    );

    // Attendance query
    const attendances = await Attendance.find({
      employee: emp._id,
      date: { $gte: payrun.periodStart, $lte: payrun.periodEnd },
    });

    let workedDays = totalWorkingDays;
    let overtimeHours = 0;

    if (attendances.length > 0) {
      const presentCount = attendances.filter((a) => a.status === "Present" || a.status === "Late").length;
      const halfDayCount = attendances.filter((a) => a.status === "Half Day").length;
      workedDays = presentCount + halfDayCount * 0.5;

      overtimeHours = attendances.reduce((sum, a) => {
        const worked = a.workedHours || 0;
        return sum + Math.max(0, worked - 8);
      }, 0);
    }

    // Unpaid leave query
    const timeOffRequests = await TimeOffRequest.find({
      employee: emp._id,
      status: "Approved",
      startDate: { $lte: payrun.periodEnd },
      endDate: { $gte: payrun.periodStart },
    }).populate("timeOffType");

    const unpaidLeaveDays = timeOffRequests
      .filter((r) => r.timeOffType && r.timeOffType.isPaid === false)
      .reduce((sum, r) => sum + (r.duration || 0), 0);

    const paidLeaveDays = timeOffRequests
      .filter((r) => r.timeOffType && r.timeOffType.isPaid !== false)
      .reduce((sum, r) => sum + (r.duration || 0), 0);

    // 2. Variable Context
    const contractWage = contract.wagePerMonth || 0;
    const context = {
      CONTRACT_WAGE: contractWage,
      TOTAL_WORKING_DAYS: totalWorkingDays,
      SCHEDULED_DAYS: totalWorkingDays,
      WORKED_DAYS: workedDays,
      UNPAID_LEAVE_DAYS: unpaidLeaveDays,
      PAID_LEAVE_DAYS: paidLeaveDays,
      OVERTIME_HOURS: overtimeHours,
    };

    // 3. Sequential Rule Execution
    const lines = [];
    const orderedRules = salaryStructure.rules || [];

    let grossRuleVal = null;
    let netRuleVal = null;
    let fallbackGross = 0;
    let fallbackDeductions = 0;

    for (const rule of orderedRules) {
      let amount = 0;

      if (rule.computationMethod === "Fixed") {
        amount = rule.fixedAmount || 0;
      } else if (rule.computationMethod === "Percentage") {
        const baseKey = (rule.percentageOf || "CONTRACT_WAGE").toUpperCase();
        const baseVal = baseKey === "CONTRACT_WAGE" ? context.CONTRACT_WAGE : context[baseKey] || 0;
        amount = (baseVal * (rule.percentageValue || 0)) / 100;
      } else if (rule.computationMethod === "Formula") {
        try {
          amount = formulaEngine.evaluate(rule.formulaExpression, context);
        } catch (err) {
          amount = 0;
          warnings.push(`Formula error in rule ${rule.code}: ${err.message}`);
        }
      }

      amount = Math.round(amount * 100) / 100;
      context[rule.code.toUpperCase()] = amount;

      lines.push({
        salaryRule: rule._id,
        code: rule.code,
        name: rule.name,
        category: rule.category,
        amount,
      });

      if (rule.category === "Gross") {
        grossRuleVal = amount;
      } else if (rule.category === "Net") {
        netRuleVal = amount;
      } else if (["Basic", "Allowance"].includes(rule.category)) {
        fallbackGross += amount;
      } else if (rule.category === "Deduction") {
        fallbackDeductions += amount;
      }
    }

    const grossSalary = grossRuleVal !== null ? grossRuleVal : Math.round(fallbackGross * 100) / 100;
    const totalDeductions = Math.round(
      lines.filter((l) => l.category === "Deduction").reduce((sum, l) => sum + l.amount, 0) * 100
    ) / 100;
    const netSalary = netRuleVal !== null ? netRuleVal : Math.round((grossSalary - totalDeductions) * 100) / 100;

    // 4. Data Warnings Checks
    if (!emp.bankDetails || !emp.bankDetails.accountNumber) {
      warnings.push("Missing bank details");
    }

    if (netSalary < 0) {
      warnings.push("Negative net salary");
    }

    // Duplicate payslip check
    const duplicate = await Payslip.findOne({
      _id: { $ne: payslip._id },
      employee: emp._id,
      periodStart: payrun.periodStart,
      periodEnd: payrun.periodEnd,
    });
    if (duplicate) {
      warnings.push("Duplicate payslip for period");
    }

    // 5. Update Payslip
    payslip.lines = lines;
    payslip.grossSalary = grossSalary;
    payslip.totalDeductions = totalDeductions;
    payslip.netSalary = netSalary;
    payslip.workedDays = workedDays;
    payslip.unpaidLeaveDays = unpaidLeaveDays;
    payslip.overtimeHours = overtimeHours;
    payslip.status = "Computed";
    payslip.warnings = warnings;

    await payslip.save();
    warnings.forEach((w) => allPayrunWarnings.add(`${emp.fullName}: ${w}`));
  }

  // 6. Update Payrun
  payrun.status = "Computed";
  payrun.computedAt = new Date();
  payrun.warnings = Array.from(allPayrunWarnings);

  await payrun.save();
  return exports.getPayrunById(payrun._id);
};

/**
 * Validate Payrun: seals payrun against further computation
 */
exports.validatePayrun = async (payrunId) => {
  const payrun = await Payrun.findById(payrunId);
  if (!payrun) {
    const err = new Error("Payrun not found");
    err.statusCode = 404;
    throw err;
  }

  if (payrun.status !== "Computed") {
    const err = new Error("Payrun must be in 'Computed' status to validate");
    err.statusCode = 400;
    throw err;
  }

  payrun.status = "Validated";
  payrun.validatedAt = new Date();
  await payrun.save();

  await Payslip.updateMany(
    { payrun: payrun._id, status: "Computed" },
    { $set: { status: "Validated" } }
  );

  return exports.getPayrunById(payrun._id);
};

/**
 * Mark Paid: cascades Paid status to all payslips in payrun
 */
exports.markPaid = async (payrunId) => {
  const payrun = await Payrun.findById(payrunId);
  if (!payrun) {
    const err = new Error("Payrun not found");
    err.statusCode = 404;
    throw err;
  }

  if (payrun.status !== "Validated") {
    const err = new Error("Payrun must be in 'Validated' status before marking as Paid");
    err.statusCode = 400;
    throw err;
  }

  payrun.status = "Paid";
  payrun.paidAt = new Date();
  await payrun.save();

  await Payslip.updateMany(
    { payrun: payrun._id },
    { $set: { status: "Paid" } }
  );

  return exports.getPayrunById(payrun._id);
};

/**
 * List Payruns
 */
exports.listPayruns = async (query = {}) => {
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.department) filter.department = query.department;

  return Payrun.find(filter)
    .populate("salaryStructure")
    .populate("department")
    .populate("createdBy", "fullName email")
    .sort({ periodStart: -1, createdAt: -1 });
};

/**
 * Get Payrun by ID with member payslips
 */
exports.getPayrunById = async (id) => {
  const payrun = await Payrun.findById(id)
    .populate("salaryStructure")
    .populate("department")
    .populate("createdBy", "fullName email");

  if (!payrun) return null;

  const payslips = await Payslip.find({ payrun: id })
    .populate("employee", "fullName employeeCode email department bankDetails")
    .populate("contract");

  return {
    ...payrun.toJSON(),
    payslips,
  };
};

/**
 * Delete Draft Payrun
 */
exports.deletePayrun = async (id) => {
  const payrun = await Payrun.findById(id);
  if (!payrun) {
    const err = new Error("Payrun not found");
    err.statusCode = 404;
    throw err;
  }

  if (payrun.status !== "Draft") {
    const err = new Error("Only Draft payruns can be deleted");
    err.statusCode = 400;
    throw err;
  }

  await Payslip.deleteMany({ payrun: id });
  await Payrun.findByIdAndDelete(id);
  return payrun;
};

/**
 * Helper to resolve Employee ID for a user (via user.employee reference or fallback email match)
 */
const resolveEmployeeIdForUser = async (user) => {
  if (!user) return null;
  if (user.employee) {
    return user.employee._id ? user.employee._id.toString() : user.employee.toString();
  }
  if (user.email) {
    const normalizedEmail = user.email.toLowerCase().trim();
    const emp = await Employee.findOne({ email: normalizedEmail }).select("_id");
    if (emp) return emp._id.toString();
  }
  return null;
};

/**
 * List Payslips with role scoping
 */
exports.listPayslips = async (query = {}, user = null) => {
  const filter = {};

  const isPayrollOrAdmin =
    user &&
    user.roles &&
    user.roles.some((r) =>
      ["Admin", "HR Payroll User", "HR Payroll Manager"].includes(r)
    );

  if (!isPayrollOrAdmin) {
    const employeeId = await resolveEmployeeIdForUser(user);
    if (!employeeId) return [];
    filter.employee = employeeId;
    if (query.status) {
      filter.status = query.status;
    }
  } else {
    if (query.employee) filter.employee = query.employee;
    if (query.status) filter.status = query.status;
  }

  if (query.payrun) filter.payrun = query.payrun;

  return Payslip.find(filter)
    .populate("employee", "fullName employeeCode email department bankDetails")
    .populate("contract")
    .populate("salaryStructure")
    .populate("payrun", "name periodStart periodEnd status")
    .sort({ periodStart: -1, createdAt: -1 });
};

/**
 * Get Payslip by ID with role scoping
 */
exports.getPayslipById = async (id, user = null) => {
  const payslip = await Payslip.findById(id)
    .populate("employee", "fullName employeeCode email department bankDetails")
    .populate("contract")
    .populate("salaryStructure")
    .populate("payrun", "name periodStart periodEnd status");

  if (!payslip) return null;

  if (user) {
    const isPayrollOrAdmin =
      user.roles &&
      user.roles.some((r) =>
        ["Admin", "HR Payroll User", "HR Payroll Manager"].includes(r)
      );

    if (!isPayrollOrAdmin) {
      const userEmployeeId = await resolveEmployeeIdForUser(user);
      const payslipEmployeeId = payslip.employee
        ? (payslip.employee._id || payslip.employee).toString()
        : null;

      if (!userEmployeeId || !payslipEmployeeId || payslipEmployeeId !== userEmployeeId) {
        const err = new Error("Forbidden: You can only view your own payslips");
        err.statusCode = 403;
        throw err;
      }
    }
  }

  return payslip;
};

/**
 * Manual line override on a Payslip before validation
 */
exports.updatePayslipLine = async (payslipId, lineData) => {
  const payslip = await Payslip.findById(payslipId);
  if (!payslip) {
    const err = new Error("Payslip not found");
    err.statusCode = 404;
    throw err;
  }

  if (payslip.status === "Validated" || payslip.status === "Paid") {
    const err = new Error("Cannot modify a validated or paid payslip");
    err.statusCode = 400;
    throw err;
  }

  if (lineData.lines) {
    payslip.lines = lineData.lines;
    const gross = payslip.lines
      .filter((l) => ["Basic", "Allowance", "Gross"].includes(l.category))
      .reduce((sum, l) => sum + (l.amount || 0), 0);
    const deductions = payslip.lines
      .filter((l) => l.category === "Deduction")
      .reduce((sum, l) => sum + (l.amount || 0), 0);

    payslip.grossSalary = lineData.grossSalary !== undefined ? lineData.grossSalary : gross;
    payslip.totalDeductions = lineData.totalDeductions !== undefined ? lineData.totalDeductions : deductions;
    payslip.netSalary = lineData.netSalary !== undefined ? lineData.netSalary : gross - deductions;
  }

  if (lineData.netSalary !== undefined) payslip.netSalary = lineData.netSalary;
  if (lineData.grossSalary !== undefined) payslip.grossSalary = lineData.grossSalary;
  if (lineData.totalDeductions !== undefined) payslip.totalDeductions = lineData.totalDeductions;

  await payslip.save();
  return exports.getPayslipById(payslip._id);
};

/**
 * Delete Payslip (only while payrun is in Draft status)
 */
exports.deletePayslip = async (id) => {
  const payslip = await Payslip.findById(id).populate("payrun");
  if (!payslip) {
    const err = new Error("Payslip not found");
    err.statusCode = 404;
    throw err;
  }

  if (payslip.payrun && payslip.payrun.status !== "Draft") {
    const err = new Error("Cannot delete a payslip from a non-draft payrun");
    err.statusCode = 400;
    throw err;
  }

  await Payslip.findByIdAndDelete(id);
  return payslip;
};
