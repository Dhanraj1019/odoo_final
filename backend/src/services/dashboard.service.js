const mongoose = require("mongoose");
const Payslip = require("../models/Payslip");
const Payrun = require("../models/Payrun");
const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");
const TimeOffRequest = require("../models/TimeOffRequest");
const Department = require("../models/Department");

/**
 * Normalizes start and end dates from period or query parameters
 */
const resolveDateRange = (query) => {
  if (query.from && query.to) {
    const from = new Date(query.from);
    from.setUTCHours(0, 0, 0, 0);
    const to = new Date(query.to);
    to.setUTCHours(23, 59, 59, 999);
    return { from, to };
  }

  if (query.period && /^\d{4}-\d{2}$/.test(query.period)) {
    const [year, month] = query.period.split("-").map(Number);
    const from = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const to = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    return { from, to };
  }

  // Default: current calendar month
  const now = new Date();
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
  return { from, to };
};

exports.getDashboardData = async (query = {}, user = null) => {
  const { from, to } = resolveDateRange(query);
  const { department, employeeType } = query;

  // Determine role scope (full vs hr)
  const isPayrollOrAdmin =
    user &&
    user.roles &&
    user.roles.some((r) =>
      ["Admin", "HR Payroll User", "HR Payroll Manager"].includes(r)
    );

  const scope = query.scope === "hr" || !isPayrollOrAdmin ? "hr" : "full";

  // Build employee filter if department or employeeType is specified
  const empMatch = {};
  if (department) {
    empMatch.department = new mongoose.Types.ObjectId(department);
  }
  if (employeeType && employeeType !== "All") {
    empMatch.employeeType = employeeType;
  }

  let scopedEmployeeIds = null;
  if (department || (employeeType && employeeType !== "All")) {
    const matchedEmps = await Employee.find(empMatch).select("_id");
    scopedEmployeeIds = matchedEmps.map((e) => e._id);
  }

  // 1. Payslip Matches
  const payslipMatch = {
    periodStart: { $gte: from, $lte: to },
  };
  if (scopedEmployeeIds) {
    payslipMatch.employee = { $in: scopedEmployeeIds };
  }

  const paidPayslipMatch = {
    ...payslipMatch,
    status: "Paid",
  };

  // 2. KPIs Aggregations
  const paidSalaryAgg = await Payslip.aggregate([
    { $match: paidPayslipMatch },
    { $group: { _id: null, total: { $sum: "$netSalary" }, count: { $sum: 1 } } },
  ]);

  const totalNetSalaryPaid = paidSalaryAgg.length > 0 ? Math.round(paidSalaryAgg[0].total * 100) / 100 : 0;
  const paidPayslipCount = paidSalaryAgg.length > 0 ? paidSalaryAgg[0].count : 0;
  const payslipsGenerated = await Payslip.countDocuments(payslipMatch);
  const averageSalary = paidPayslipCount > 0 ? Math.round((totalNetSalaryPaid / paidPayslipCount) * 100) / 100 : 0;

  // Time off KPI
  const timeOffMatch = {
    status: "Approved",
    startDate: { $lte: to },
    endDate: { $gte: from },
  };
  if (scopedEmployeeIds) {
    timeOffMatch.employee = { $in: scopedEmployeeIds };
  }

  const timeOffAgg = await TimeOffRequest.aggregate([
    { $match: timeOffMatch },
    { $group: { _id: null, totalDays: { $sum: "$duration" } } },
  ]);
  const approvedTimeOffDays = timeOffAgg.length > 0 ? timeOffAgg[0].totalDays : 0;

  // Attendance KPI & Overview
  const attMatch = {
    date: { $gte: from, $lte: to },
  };
  if (scopedEmployeeIds) {
    attMatch.employee = { $in: scopedEmployeeIds };
  }

  const attAgg = await Attendance.aggregate([
    { $match: attMatch },
    { $group: { _id: "$status", count: { $sum: 1 }, totalWorked: { $sum: "$workedHours" } } },
  ]);

  const attMap = { Present: 0, Late: 0, Absent: 0, "Half Day": 0, "On Leave": 0 };
  let totalAttRecords = 0;
  let totalOvertimeHours = 0;

  attAgg.forEach((a) => {
    if (a._id in attMap) attMap[a._id] = a.count;
    totalAttRecords += a.count;
  });

  const presentOrLate = attMap.Present + attMap.Late + attMap["Half Day"];
  const attendanceHealthPercent = totalAttRecords > 0 ? Math.round((presentOrLate / totalAttRecords) * 100) : 100;
  const coveragePercent = totalAttRecords > 0 ? Math.round(((totalAttRecords - attMap.Absent) / totalAttRecords) * 100) : 100;

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const missingCheckouts = await Attendance.countDocuments({
    ...attMatch,
    checkIn: { $ne: null },
    checkOut: null,
    date: { $lt: today },
  });

  const manualEdits = await Attendance.countDocuments({
    ...attMatch,
    isManualCorrection: true,
  });

  // 3. Charts (Only for scope=full)
  let salaryCostByDepartment = [];
  let monthlyNetSalaryTrend = [];

  if (scope === "full") {
    // Salary Cost by Department
    salaryCostByDepartment = await Payslip.aggregate([
      { $match: { status: "Paid", periodStart: { $gte: from, $lte: to } } },
      { $lookup: { from: "employees", localField: "employee", foreignField: "_id", as: "emp" } },
      { $unwind: "$emp" },
      { $group: { _id: "$emp.department", amount: { $sum: "$netSalary" } } },
      { $lookup: { from: "departments", localField: "_id", foreignField: "_id", as: "dept" } },
      { $unwind: { path: "$dept", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          department: { $ifNull: ["$dept.name", "General"] },
          amount: { $round: ["$amount", 2] },
          _id: 0,
        },
      },
      { $sort: { amount: -1 } },
    ]);

    // Monthly Net Salary Trend (Last 12 months)
    const twelveMonthsAgo = new Date(from);
    twelveMonthsAgo.setUTCMonth(twelveMonthsAgo.getUTCMonth() - 11);
    twelveMonthsAgo.setUTCDate(1);

    monthlyNetSalaryTrend = await Payslip.aggregate([
      { $match: { status: "Paid", periodStart: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$periodStart" } },
          amount: { $sum: "$netSalary" },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          month: "$_id",
          amount: { $round: ["$amount", 2] },
          _id: 0,
        },
      },
    ]);
  }

  // 4. Alerts
  const payslipsInScope = await Payslip.find(payslipMatch).populate("employee");
  let missingBankCount = 0;
  let duplicateCount = 0;
  let noContractCount = 0;

  payslipsInScope.forEach((ps) => {
    if (!ps.employee || !ps.employee.bankDetails || !ps.employee.bankDetails.accountNumber) {
      missingBankCount++;
    }
    if (ps.warnings && ps.warnings.some((w) => w.toLowerCase().includes("duplicate"))) {
      duplicateCount++;
    }
    if (ps.warnings && ps.warnings.some((w) => w.toLowerCase().includes("no active contract"))) {
      noContractCount++;
    }
  });

  const pendingPayruns = await Payrun.countDocuments({
    status: { $in: ["Draft", "Computed"] },
  });

  const alerts = [
    { type: "missing_bank_details", count: missingBankCount },
    { type: "duplicate_payslip", count: duplicateCount },
    { type: "no_active_contract", count: noContractCount },
    ...(scope === "full" ? [{ type: "pending_payruns", count: pendingPayruns }] : []),
  ];

  // 5. Time Off Overview
  const pendingTimeOffRequests = await TimeOffRequest.countDocuments({
    status: "Submitted",
  });

  // 6. Department Breakdown
  const deptHeadcounts = await Employee.aggregate([
    { $match: { status: "Active" } },
    { $group: { _id: "$department", headcount: { $sum: 1 } } },
    { $lookup: { from: "departments", localField: "_id", foreignField: "_id", as: "dept" } },
    { $unwind: { path: "$dept", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        department: { $ifNull: ["$dept.name", "General"] },
        departmentId: "$_id",
        headcount: 1,
        _id: 0,
      },
    },
  ]);

  const salaryByDeptMap = new Map(salaryCostByDepartment.map((d) => [d.department, d.amount]));

  const departmentBreakdown = deptHeadcounts.map((d) => {
    const item = {
      department: d.department,
      headcount: d.headcount,
    };
    if (scope === "full") {
      item.totalSalary = salaryByDeptMap.get(d.department) || 0;
    }
    return item;
  });

  // 7. Return Final Structured Payload
  const responseData = {
    scope,
    period: { from, to },
    kpis: {
      ...(scope === "full"
        ? {
            totalNetSalaryPaid,
            payslipsGenerated,
            averageSalary,
          }
        : {}),
      approvedTimeOffDays,
      attendanceHealthPercent,
    },
    ...(scope === "full"
      ? {
          charts: {
            salaryCostByDepartment,
            monthlyNetSalaryTrend,
          },
        }
      : {}),
    alerts,
    attendanceOverview: {
      present: attMap.Present,
      late: attMap.Late,
      absent: attMap.Absent,
      halfDay: attMap["Half Day"],
      overtime: totalOvertimeHours,
      missingCheckouts,
      manualEdits,
      coveragePercent,
    },
    timeOffOverview: {
      approvedDays: approvedTimeOffDays,
      pendingRequests: pendingTimeOffRequests,
    },
    departmentBreakdown,
  };

  return responseData;
};
