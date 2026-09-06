const PDFDocument = require("pdfkit");
const Payslip = require("../models/Payslip");
const Employee = require("../models/Employee");
const Contract = require("../models/Contract");
const SalaryStructure = require("../models/SalaryStructure");
const SalaryRule = require("../models/SalaryRule");
const Attendance = require("../models/Attendance");
const TimeOffRequest = require("../models/TimeOffRequest");
require("../models/Department");
require("../models/JobPosition");
require("../models/WorkingSchedule");
require("../models/Payrun");

const contractService = require("./contract.service");
const formulaEngine = require("./formulaEngine.service");

/**
 * Format Date to DD MMM YYYY or YYYY-MM-DD
 */
const formatDate = (date) => {
  if (!date) return "N/A";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "N/A";
  const day = String(d.getUTCDate()).padStart(2, "0");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[d.getUTCMonth()];
  const year = d.getUTCFullYear();
  return `${day} ${month} ${year}`;
};

/**
 * Format Currency (e.g. ₹ 60,000.00)
 */
const formatCurrency = (amount) => {
  const num = typeof amount === "number" ? amount : Number(amount) || 0;
  return `₹ ${num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Clean human-readable display names by removing raw internal timestamps / generated IDs
 */
const cleanDisplayName = (name) => {
  if (!name || typeof name !== "string") return "N/A";
  return name
    .replace(/\s+(Structure\s+)?\d{10,}/gi, "")
    .replace(/\s+\d{10,}/gi, "")
    .replace(/\s*Updated\s*\d{10,}/gi, "")
    .trim();
};

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
 * Counts scheduled working days in period
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
 * STEP 4: Build a clean, explicitly mapped PDF data object
 */
const preparePayslipPdfData = async (payslipId) => {
  let payslip = await Payslip.findById(payslipId)
    .populate({
      path: "employee",
      populate: [{ path: "department" }, { path: "jobPosition" }, { path: "workingSchedule" }],
    })
    .populate({
      path: "contract",
      populate: [{ path: "salaryStructure", populate: { path: "rules" } }],
    })
    .populate({
      path: "salaryStructure",
      populate: { path: "rules" },
    })
    .populate("payrun");

  if (!payslip) {
    const err = new Error("Payslip not found");
    err.statusCode = 404;
    throw err;
  }

  const employee = payslip.employee || {};
  const department = employee.department || {};
  const jobPosition = employee.jobPosition || {};
  const bankDetails = employee.bankDetails || {};

  // Resolve contract if missing
  let contract = payslip.contract;
  if (!contract) {
    const resolution = await contractService.resolveApplicableContract(
      employee._id,
      payslip.periodStart,
      payslip.periodEnd
    );
    contract = resolution.contract;
  }

  // Resolve salary structure
  let salaryStructure = payslip.salaryStructure || contract?.salaryStructure;
  if (!salaryStructure || !salaryStructure.rules || salaryStructure.rules.length === 0) {
    const structId = contract?.salaryStructure || payslip.salaryStructure?._id || payslip.salaryStructure;
    if (structId) {
      salaryStructure = await SalaryStructure.findById(structId).populate("rules");
    }
  }

  // If still no structure, try finding the active structure with rules
  if (!salaryStructure || !salaryStructure.rules || salaryStructure.rules.length === 0) {
    salaryStructure = await SalaryStructure.findOne({ status: "Active" }).populate("rules");
  }

  let salaryLines = Array.isArray(payslip.lines) ? [...payslip.lines] : [];
  let grossSalary = Number(payslip.grossSalary) || 0;
  let totalDeductions = Number(payslip.totalDeductions) || 0;
  let netSalary = Number(payslip.netSalary) || 0;

  // STEP 6: If salary rule lines are missing or empty, calculate them dynamically from contract & structure
  if (
    (salaryLines.length === 0 || (grossSalary === 0 && netSalary === 0)) &&
    salaryStructure &&
    Array.isArray(salaryStructure.rules) &&
    salaryStructure.rules.length > 0
  ) {
    console.log(`[PDF] Calculating salary rule lines dynamically for payslip ${payslip._id}`);

    const scheduledDays = countWorkingDaysInPeriod(
      contract?.workingSchedule || employee?.workingSchedule,
      payslip.periodStart,
      payslip.periodEnd
    );

    const attendances = await Attendance.find({
      employee: employee._id,
      date: { $gte: payslip.periodStart, $lte: payslip.periodEnd },
    });

    let workedDays = scheduledDays;
    let overtimeHours = 0;
    if (attendances.length > 0) {
      const presentCount = attendances.filter((a) => a.status === "Present" || a.status === "Late").length;
      const halfDayCount = attendances.filter((a) => a.status === "Half Day").length;
      workedDays = presentCount + halfDayCount * 0.5;
      overtimeHours = attendances.reduce((sum, a) => sum + Math.max(0, (a.workedHours || 0) - 8), 0);
    }

    const timeOffRequests = await TimeOffRequest.find({
      employee: employee._id,
      status: "Approved",
      startDate: { $lte: payslip.periodEnd },
      endDate: { $gte: payslip.periodStart },
    }).populate("timeOffType");

    const unpaidLeaveDays = timeOffRequests
      .filter((r) => r.timeOffType && r.timeOffType.isPaid === false)
      .reduce((sum, r) => sum + (r.duration || 0), 0);

    const paidLeaveDays = timeOffRequests
      .filter((r) => r.timeOffType && r.timeOffType.isPaid !== false)
      .reduce((sum, r) => sum + (r.duration || 0), 0);

    const contractWage = contract?.wagePerMonth || 0;
    const context = {
      CONTRACT_WAGE: contractWage,
      WAGE: contractWage,
      TOTAL_WORKING_DAYS: scheduledDays,
      SCHEDULED_DAYS: scheduledDays,
      WORKED_DAYS: workedDays,
      UNPAID_LEAVE_DAYS: unpaidLeaveDays,
      PAID_LEAVE_DAYS: paidLeaveDays,
      OVERTIME_HOURS: overtimeHours,
    };

    const computedLines = [];
    let grossRuleVal = null;
    let netRuleVal = null;
    let fallbackGross = 0;
    let fallbackDeductions = 0;

    for (const rule of salaryStructure.rules) {
      let amount = 0;
      if (rule.computationMethod === "Fixed") {
        amount = rule.fixedAmount || 0;
      } else if (rule.computationMethod === "Percentage") {
        const baseKey = (rule.percentageOf || "CONTRACT_WAGE").toUpperCase();
        const baseVal =
          baseKey === "CONTRACT_WAGE" || baseKey === "WAGE"
            ? context.CONTRACT_WAGE
            : context[baseKey] || 0;
        amount = (baseVal * (rule.percentageValue || 0)) / 100;
      } else if (rule.computationMethod === "Formula") {
        try {
          amount = formulaEngine.evaluate(rule.formulaExpression, context);
        } catch (err) {
          console.error(`[PDF Formula Error] Rule ${rule.code}:`, err.message);
          amount = 0;
        }
      }

      amount = Math.round(amount * 100) / 100;
      context[rule.code.toUpperCase()] = amount;

      computedLines.push({
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

    grossSalary = grossRuleVal !== null ? grossRuleVal : Math.round(fallbackGross * 100) / 100;
    totalDeductions = Math.round(
      computedLines.filter((l) => l.category === "Deduction").reduce((sum, l) => sum + l.amount, 0) * 100
    ) / 100;
    netSalary = netRuleVal !== null ? netRuleVal : Math.round((grossSalary - totalDeductions) * 100) / 100;
    salaryLines = computedLines;

    // Cache computed lines on payslip
    payslip.lines = computedLines;
    payslip.grossSalary = grossSalary;
    payslip.totalDeductions = totalDeductions;
    payslip.netSalary = netSalary;
    payslip.workedDays = workedDays;
    if (salaryStructure) payslip.salaryStructure = salaryStructure._id;
    if (contract) payslip.contract = contract._id;
    await payslip.save();
  }

  // Final Explicitly Mapped PDF Data Object
  const pdfData = {
    employee: {
      name: employee.fullName || "N/A",
      code: employee.employeeCode || "N/A",
      department: department.name || (typeof employee.department === "string" ? employee.department : "General"),
      designation: jobPosition.name || (typeof employee.jobPosition === "string" ? employee.jobPosition : "Staff"),
      email: employee.email || "N/A",
      bankAccount: bankDetails.accountNumber || "N/A",
      bankName: bankDetails.bankName || "N/A",
    },
    payroll: {
      payslipCode:
        payslip.payslipCode ||
        `SLIP/${new Date(payslip.periodStart || Date.now()).toISOString().slice(0, 7)}/${
          employee.employeeCode || "EMP"
        }`,
      payPeriodStart: formatDate(payslip.periodStart),
      payPeriodEnd: formatDate(payslip.periodEnd),
      status: payslip.status || "Draft",
      workedDays: payslip.workedDays != null ? payslip.workedDays : 0,
      scheduledDays: payslip.scheduledDays != null ? payslip.scheduledDays : 0,
      paymentDate: payslip.paymentDate ? formatDate(payslip.paymentDate) : "Pending",
    },
    salaryStructure: {
      name: cleanDisplayName(salaryStructure?.name || "Standard Corporate Structure"),
    },
    salaryLines: salaryLines.map((line) => ({
      name: cleanDisplayName(line.name),
      code: line.code,
      category: line.category,
      amount: Number(line.amount) || 0,
    })),
    totals: {
      grossEarnings: Number(grossSalary) || 0,
      totalDeductions: Number(totalDeductions) || 0,
      netPayable: Number(netSalary) || 0,
    },
    hasRulesConfigured: Boolean(salaryStructure && salaryStructure.rules && salaryStructure.rules.length > 0),
  };

  console.log("PDF DATA MAPPED:", {
    employee: pdfData.employee,
    payroll: pdfData.payroll,
    salaryStructure: pdfData.salaryStructure,
    linesCount: pdfData.salaryLines.length,
    totals: pdfData.totals,
  });

  return pdfData;
};

/**
 * STEP 7 & 8: Render structured, non-overlapping, high-quality PDF layout
 */
const renderPayslipPdf = (pdfData, doc) => {
  const leftX = 45;
  const rightX = 310;
  const colWidth = 240;
  const fullWidth = 505;

  // 1. Company Brand Header
  doc.fillColor("#1e1b4b").fontSize(20).font("Helvetica-Bold").text("PeoplePay360", leftX, 45);
  doc.fillColor("#64748b").fontSize(9).font("Helvetica").text("Enterprise Payroll & Human Resource Management System", leftX, 70);

  doc.strokeColor("#e2e8f0").lineWidth(1).moveTo(leftX, 88).lineTo(leftX + fullWidth, 88).stroke();

  // 2. Document Title Banner Box
  const bannerY = 98;
  doc.rect(leftX, bannerY, fullWidth, 42).fillAndStroke("#f8fafc", "#e2e8f0");

  doc.fillColor("#0f172a").fontSize(13).font("Helvetica-Bold").text("SALARY PAYSLIP", leftX + 14, bannerY + 10);
  doc.fillColor("#64748b").fontSize(8.5).font("Helvetica").text(`Ref: ${pdfData.payroll.payslipCode}`, leftX + 14, bannerY + 26);

  doc.fillColor("#4338ca").fontSize(9.5).font("Helvetica-Bold").text(
    `Pay Period: ${pdfData.payroll.payPeriodStart} → ${pdfData.payroll.payPeriodEnd}`,
    leftX + 220,
    bannerY + 15,
    { width: fullWidth - 234, align: "right" }
  );

  // 3. Employee & Payroll Information Two-Column Card
  const cardY = 150;
  doc.rect(leftX, cardY, fullWidth, 128).fillAndStroke("#ffffff", "#e2e8f0");

  // Section Headers
  doc.fillColor("#4338ca").fontSize(9).font("Helvetica-Bold").text("EMPLOYEE DETAILS", leftX + 14, cardY + 10);
  doc.fillColor("#4338ca").fontSize(9).font("Helvetica-Bold").text("PAYROLL DETAILS", rightX, cardY + 10);

  doc.strokeColor("#f1f5f9").lineWidth(0.75).moveTo(leftX + 10, cardY + 24).lineTo(leftX + fullWidth - 10, cardY + 24).stroke();

  // Row-based rendering with explicit spacing to guarantee zero text collision
  const rows = [
    {
      leftLabel: "Employee Name:",
      leftVal: pdfData.employee.name,
      rightLabel: "Salary Structure:",
      rightVal: pdfData.salaryStructure.name,
    },
    {
      leftLabel: "Employee Code:",
      leftVal: pdfData.employee.code,
      rightLabel: "Status:",
      rightVal: pdfData.payroll.status,
    },
    {
      leftLabel: "Department:",
      leftVal: pdfData.employee.department,
      rightLabel: "Worked Days:",
      rightVal: `${pdfData.payroll.workedDays}`,
    },
    {
      leftLabel: "Designation:",
      leftVal: pdfData.employee.designation,
      rightLabel: "Bank Account:",
      rightVal: `${pdfData.employee.bankAccount} (${pdfData.employee.bankName})`,
    },
  ];

  let currentY = cardY + 32;
  const labelWidth = 95;
  const valueWidth = 145;

  rows.forEach((row) => {
    // Left Column Label + Value
    doc.fillColor("#64748b").fontSize(8.5).font("Helvetica-Bold").text(row.leftLabel, leftX + 14, currentY, { width: labelWidth });
    doc.fillColor("#0f172a").fontSize(8.5).font("Helvetica").text(row.leftVal, leftX + 14 + labelWidth, currentY, { width: valueWidth });

    // Right Column Label + Value
    doc.fillColor("#64748b").fontSize(8.5).font("Helvetica-Bold").text(row.rightLabel, rightX, currentY, { width: labelWidth });
    doc.fillColor("#0f172a").fontSize(8.5).font("Helvetica").text(row.rightVal, rightX + labelWidth, currentY, { width: valueWidth });

    currentY += 22;
  });

  // 4. Salary Components Table
  const tableY = 290;
  const col1X = leftX + 12;
  const col1W = 240;
  const col2X = leftX + 260;
  const col2W = 100;
  const col3X = leftX + 370;
  const col3W = 120;

  // Table Header Box
  doc.rect(leftX, tableY, fullWidth, 24).fillAndStroke("#f1f5f9", "#cbd5e1");
  doc.fillColor("#334155").fontSize(9).font("Helvetica-Bold");
  doc.text("SALARY COMPONENT", col1X, tableY + 7, { width: col1W });
  doc.text("CATEGORY", col2X, tableY + 7, { width: col2W, align: "center" });
  doc.text("AMOUNT", col3X, tableY + 7, { width: col3W, align: "right" });

  let lineY = tableY + 24;
  const lines = pdfData.salaryLines || [];

  if (lines.length === 0) {
    doc.rect(leftX, lineY, fullWidth, 36).fillAndStroke("#ffffff", "#e2e8f0");
    const emptyMsg = pdfData.hasRulesConfigured
      ? "No salary rule lines calculated for this period."
      : "Payroll calculation note: No salary rules are configured for the selected salary structure.";
    doc.fillColor("#94a3b8").fontSize(9).font("Helvetica-Oblique").text(emptyMsg, leftX + 14, lineY + 12, { width: fullWidth - 28 });
    lineY += 36;
  } else {
    lines.forEach((line, idx) => {
      const isEven = idx % 2 === 0;
      const rowHeight = 22;
      doc.rect(leftX, lineY, fullWidth, rowHeight).fillAndStroke(isEven ? "#ffffff" : "#f8fafc", "#e2e8f0");

      doc.fillColor("#1e293b").fontSize(9).font("Helvetica-Bold").text(line.name, col1X, lineY + 6, { width: col1W });
      doc.fillColor("#64748b").fontSize(8.5).font("Helvetica").text(line.category, col2X, lineY + 6, { width: col2W, align: "center" });

      const isDeduction = line.category === "Deduction";
      doc.fillColor(isDeduction ? "#b91c1c" : "#0f172a").fontSize(9).font("Helvetica-Bold").text(
        isDeduction ? `- ${formatCurrency(line.amount)}` : formatCurrency(line.amount),
        col3X,
        lineY + 6,
        { width: col3W, align: "right" }
      );

      lineY += rowHeight;
    });
  }

  // 5. Totals Summary Box
  const summaryBoxY = lineY + 12;
  const sumWidth = 230;
  const sumX = leftX + fullWidth - sumWidth;

  doc.rect(sumX, summaryBoxY, sumWidth, 90).fillAndStroke("#ffffff", "#cbd5e1");

  doc.fillColor("#475569").fontSize(9).font("Helvetica-Bold").text("Gross Earnings:", sumX + 12, summaryBoxY + 10, { width: 110 });
  doc.fillColor("#0f172a").fontSize(9).font("Helvetica-Bold").text(formatCurrency(pdfData.totals.grossEarnings), sumX + 115, summaryBoxY + 10, { width: 100, align: "right" });

  doc.fillColor("#475569").fontSize(9).font("Helvetica-Bold").text("Total Deductions:", sumX + 12, summaryBoxY + 28, { width: 110 });
  doc.fillColor("#b91c1c").fontSize(9).font("Helvetica-Bold").text(`- ${formatCurrency(pdfData.totals.totalDeductions)}`, sumX + 115, summaryBoxY + 28, { width: 100, align: "right" });

  // NET PAYABLE Highlight Box
  doc.rect(sumX + 6, summaryBoxY + 48, sumWidth - 12, 34).fillAndStroke("#eef2ff", "#4338ca");

  doc.fillColor("#3730a3").fontSize(10).font("Helvetica-Bold").text("NET PAYABLE", sumX + 14, summaryBoxY + 60, { width: 95 });
  doc.fillColor("#3730a3").fontSize(12).font("Helvetica-Bold").text(formatCurrency(pdfData.totals.netPayable), sumX + 105, summaryBoxY + 58, { width: 105, align: "right" });

  // 6. Signature & Footer
  const footerY = 740;
  doc.strokeColor("#e2e8f0").lineWidth(1).moveTo(leftX, footerY).lineTo(leftX + fullWidth, footerY).stroke();

  doc.fillColor("#64748b").fontSize(8).font("Helvetica").text(
    "This is a system-generated salary slip and does not require a physical signature.",
    leftX,
    footerY + 8,
    { align: "center", width: fullWidth }
  );

  doc.fillColor("#94a3b8").fontSize(7.5).font("Helvetica").text(
    `Generated on ${new Date().toUTCString()} • PeoplePay360 HRMS Platform`,
    leftX,
    footerY + 20,
    { align: "center", width: fullWidth }
  );
};

/**
 * Stream printable PDF directly to HTTP response
 */
exports.streamPayslipPdf = async (payslipId, res, user = null) => {
  const pdfData = await preparePayslipPdfData(payslipId);

  if (user) {
    const isPayrollOrAdmin =
      user.roles &&
      user.roles.some((r) =>
        ["Admin", "HR Payroll User", "HR Payroll Manager"].includes(r)
      );

    if (!isPayrollOrAdmin) {
      let userEmployeeId = user.employee ? (user.employee._id || user.employee).toString() : null;
      if (!userEmployeeId && user.email) {
        const emp = await Employee.findOne({ email: user.email.toLowerCase().trim() }).select("_id");
        userEmployeeId = emp ? emp._id.toString() : null;
      }
      const payslip = await Payslip.findById(payslipId).select("employee");
      const payslipEmployeeId = payslip?.employee ? payslip.employee.toString() : null;

      if (!userEmployeeId || !payslipEmployeeId || payslipEmployeeId !== userEmployeeId) {
        const err = new Error("Forbidden: You can only download your own payslips");
        err.statusCode = 403;
        throw err;
      }
    }
  }

  const doc = new PDFDocument({ margin: 45, size: "A4" });
  const filename = `payslip-${pdfData.employee.code}-${pdfData.payroll.payPeriodStart}.pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${filename}"`);

  doc.pipe(res);
  renderPayslipPdf(pdfData, doc);
  doc.end();
};

/**
 * Generate PDF buffer in memory for email attachments
 */
exports.generatePayslipPdfBuffer = async (payslipId) => {
  const pdfData = await preparePayslipPdfData(payslipId);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 45, size: "A4" });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    renderPayslipPdf(pdfData, doc);
    doc.end();
  });
};

exports.preparePayslipPdfData = preparePayslipPdfData;
exports.renderPayslipPdf = renderPayslipPdf;
