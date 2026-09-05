const nodemailer = require("nodemailer");
const Payrun = require("../models/Payrun");
const Payslip = require("../models/Payslip");
const pdfService = require("./pdf.service");

/**
 * Creates or retrieves the Nodemailer transporter instance
 */
let cachedTransporter = null;

const getTransporter = async () => {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user) {
    cachedTransporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    return cachedTransporter;
  }

  // If in test or development without SMTP configured, create a mock / ethereal transport
  if (process.env.NODE_ENV === "test" || !host) {
    cachedTransporter = nodemailer.createTransport({
      jsonTransport: true,
    });
    return cachedTransporter;
  }

  throw new Error("SMTP is not configured in environment variables");
};

/**
 * Sends a single email with optional attachments
 */
exports.sendMail = async (options) => {
  const transporter = await getTransporter();
  const from = process.env.SMTP_FROM || '"PeoplePay360 Payroll" <payroll@peoplepay360.local>';
  return transporter.sendMail({
    from,
    ...options,
  });
};

/**
 * Bulk email delivery for all payslips in a payrun
 * Specification: 18-PAYSLIP-PDF-AND-EMAIL-DELIVERY.md §4
 */
exports.sendBulkPayslips = async (payrunId) => {
  const payrun = await Payrun.findById(payrunId);
  if (!payrun) {
    const err = new Error("Payrun not found");
    err.statusCode = 404;
    throw err;
  }

  const payslips = await Payslip.find({ payrun: payrunId }).populate("employee");
  const results = [];

  for (const payslip of payslips) {
    const emp = payslip.employee;
    if (!emp) {
      results.push({ employee: "Unknown", email: null, status: "failed", error: "Missing employee record" });
      continue;
    }

    if (!emp.email) {
      results.push({ employee: emp.fullName, email: null, status: "failed", error: "Employee has no email address" });
      continue;
    }

    try {
      const pdfBuffer = await pdfService.generatePayslipPdfBuffer(payslip._id);
      const periodStr = payslip.periodStart ? new Date(payslip.periodStart).toISOString().slice(0, 7) : "period";
      const filename = `payslip-${emp.employeeCode || "EMP"}-${periodStr}.pdf`;

      await exports.sendMail({
        to: emp.email,
        subject: `Your Payslip for ${periodStr} — PeoplePay360`,
        text: `Dear ${emp.fullName},\n\nPlease find attached your official salary payslip for the pay period ${periodStr}.\n\nBest regards,\nPeoplePay360 Payroll Team`,
        attachments: [
          {
            filename,
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ],
      });

      payslip.emailSentAt = new Date();
      await payslip.save();

      results.push({
        employee: emp.fullName,
        email: emp.email,
        status: "sent",
      });
    } catch (err) {
      results.push({
        employee: emp.fullName,
        email: emp.email,
        status: "failed",
        error: err.message,
      });
    }
  }

  payrun.payslipsSentAt = new Date();
  await payrun.save();

  return results;
};
