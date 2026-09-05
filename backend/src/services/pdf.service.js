const PDFDocument = require("pdfkit");
const Payslip = require("../models/Payslip");
require("../models/Employee");
require("../models/Contract");
require("../models/Department");
require("../models/JobPosition");
require("../models/SalaryStructure");
require("../models/Payrun");

/**
 * Format Date to YYYY-MM-DD
 */
const formatDate = (date) => {
  if (!date) return "N/A";
  const d = new Date(date);
  return d.toISOString().slice(0, 10);
};

/**
 * Helper to build the visual PDFKit document for a payslip
 */
const renderPayslipPdf = (payslip, doc) => {
  const emp = payslip.employee || {};
  const dept = emp.department ? emp.department.name || emp.department : "General";
  const job = emp.jobPosition ? emp.jobPosition.name || emp.jobPosition : "Staff";
  const bank = emp.bankDetails || {};
  const structure = payslip.salaryStructure ? payslip.salaryStructure.name : "Standard";

  // 1. Header & Title
  doc.fillColor("#1e293b").fontSize(20).text("PeoplePay360", { align: "left" });
  doc.fillColor("#64748b").fontSize(10).text("Payroll & HRMS Management System", { align: "left" });
  doc.moveDown(0.5);

  doc.strokeColor("#cbd5e1").lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(1);

  doc.fillColor("#0f172a").fontSize(16).text("SALARY PAYSLIP", { align: "center", bold: true });
  doc.fillColor("#64748b").fontSize(10).text(
    `Pay Period: ${formatDate(payslip.periodStart)} to ${formatDate(payslip.periodEnd)}`,
    { align: "center" }
  );
  doc.moveDown(1);

  // 2. Employee & Payroll Information Grid
  const topY = doc.y;
  doc.fillColor("#0f172a").fontSize(10);

  // Left Column
  doc.text(`Employee Name: ${emp.fullName || "N/A"}`, 50, topY);
  doc.text(`Employee Code: ${emp.employeeCode || "N/A"}`, 50, topY + 15);
  doc.text(`Department: ${dept}`, 50, topY + 30);
  doc.text(`Designation: ${job}`, 50, topY + 45);

  // Right Column
  doc.text(`Salary Structure: ${structure}`, 320, topY);
  doc.text(`Status: ${payslip.status || "Draft"}`, 320, topY + 15);
  doc.text(`Worked / Scheduled Days: ${payslip.workedDays || 0}`, 320, topY + 30);
  doc.text(`Bank A/C: ${bank.accountNumber || "N/A"} (${bank.bankName || "N/A"})`, 320, topY + 45);

  doc.y = topY + 70;
  doc.strokeColor("#cbd5e1").lineWidth(0.5).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(1);

  // 3. Itemized Salary Rules Table
  doc.fillColor("#334155").fontSize(11).font("Helvetica-Bold");
  doc.text("Salary Component", 50, doc.y, { continued: true });
  doc.text("Category", 280, doc.y, { continued: true });
  doc.text("Amount (USD)", 420, doc.y, { align: "right" });
  doc.font("Helvetica");

  doc.moveDown(0.5);
  doc.strokeColor("#94a3b8").lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(0.5);

  const lines = payslip.lines || [];
  if (lines.length === 0) {
    doc.fillColor("#94a3b8").fontSize(10).text("No salary rule lines calculated for this period.", 50, doc.y);
    doc.moveDown(1);
  } else {
    lines.forEach((line) => {
      const lineY = doc.y;
      doc.fillColor("#1e293b").fontSize(10);
      doc.text(`${line.name} [${line.code}]`, 50, lineY, { width: 220 });
      doc.fillColor("#64748b").text(line.category, 280, lineY);
      doc.fillColor("#0f172a").text(
        line.category === "Deduction" ? `-${line.amount.toFixed(2)}` : `${line.amount.toFixed(2)}`,
        420,
        lineY,
        { align: "right" }
      );
      doc.moveDown(0.5);
    });
  }

  doc.moveDown(0.5);
  doc.strokeColor("#cbd5e1").lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(1);

  // 4. Totals Summary Box
  const summaryY = doc.y;
  doc.fillColor("#334155").fontSize(10);
  doc.text(`Gross Earnings:`, 300, summaryY, { continued: true });
  doc.text(`$${(payslip.grossSalary || 0).toFixed(2)}`, 420, summaryY, { align: "right" });

  doc.text(`Total Deductions:`, 300, summaryY + 18, { continued: true });
  doc.text(`$${(payslip.totalDeductions || 0).toFixed(2)}`, 420, summaryY + 18, { align: "right" });

  doc.strokeColor("#0f172a").lineWidth(1.5).moveTo(300, summaryY + 36).lineTo(550, summaryY + 36).stroke();

  doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(12);
  doc.text(`NET PAYABLE:`, 300, summaryY + 45, { continued: true });
  doc.text(`$${(payslip.netSalary || 0).toFixed(2)}`, 420, summaryY + 45, { align: "right" });
  doc.font("Helvetica");

  // 5. Footer
  doc.fontSize(8).fillColor("#94a3b8").text(
    `This is a system-generated document from PeoplePay360. Generated on ${new Date().toISOString()}`,
    50,
    720,
    { align: "center", width: 500 }
  );
};

/**
 * Stream printable PDF directly to HTTP response
 */
exports.streamPayslipPdf = async (payslipId, res, user = null) => {
  const payslip = await Payslip.findById(payslipId)
    .populate({
      path: "employee",
      populate: [{ path: "department" }, { path: "jobPosition" }],
    })
    .populate("contract")
    .populate("salaryStructure")
    .populate("payrun");

  if (!payslip) {
    const err = new Error("Payslip not found");
    err.statusCode = 404;
    throw err;
  }

  if (user) {
    const isPayrollOrAdmin =
      user.roles &&
      user.roles.some((r) =>
        ["Admin", "HR Payroll User", "HR Payroll Manager"].includes(r)
      );

    if (!isPayrollOrAdmin) {
      const empId = payslip.employee ? payslip.employee._id || payslip.employee : null;
      if (!empId || empId.toString() !== (user.employee ? user.employee.toString() : "")) {
        const err = new Error("Forbidden");
        err.statusCode = 403;
        throw err;
      }
      if (payslip.status !== "Paid") {
        const err = new Error("Payslip is not yet published");
        err.statusCode = 403;
        throw err;
      }
    }
  }

  const doc = new PDFDocument({ margin: 50, size: "A4" });
  const empCode = payslip.employee ? payslip.employee.employeeCode || "EMP" : "EMP";
  const periodStr = payslip.periodStart ? formatDate(payslip.periodStart).slice(0, 7) : "period";
  const filename = `payslip-${empCode}-${periodStr}.pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${filename}"`);

  doc.pipe(res);
  renderPayslipPdf(payslip, doc);
  doc.end();
};

/**
 * Generate PDF buffer in memory for email attachments
 */
exports.generatePayslipPdfBuffer = async (payslipId) => {
  const payslip = await Payslip.findById(payslipId)
    .populate({
      path: "employee",
      populate: [{ path: "department" }, { path: "jobPosition" }],
    })
    .populate("contract")
    .populate("salaryStructure")
    .populate("payrun");

  if (!payslip) {
    throw new Error("Payslip not found");
  }

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    renderPayslipPdf(payslip, doc);
    doc.end();
  });
};
