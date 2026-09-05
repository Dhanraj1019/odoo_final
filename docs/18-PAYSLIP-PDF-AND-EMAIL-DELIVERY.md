# 18 — Payslip PDF & Email Delivery

## 1. Scope

Two official requirements:
1. **"Print Payslip"** — generate a printable PDF for a single employee's payslip.
2. **"Send Payslips"** (from the parent Payrun) — bulk email distribution to all employees in that run.

## 2. Technology (Confirmed)

- **PDFKit** for PDF generation (`pdf.service.js`).
- **Nodemailer** for email (`mailer.service.js`), SMTP config from `.env` only — never hardcoded credentials.

## 3. PDF Generation Flow

`GET /api/payslips/:id/pdf`:

```js
async function generatePayslipPdf(payslipId, res) {
  const payslip = await Payslip.findById(payslipId)
    .populate("employee").populate("contract").populate("payrun").populate("salaryStructure");
  const doc = new PDFDocument({ margin: 50 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename=payslip-${payslip.employee.employeeCode}-${payslip.periodStart.toISOString().slice(0,7)}.pdf`);
  doc.pipe(res);

  doc.fontSize(18).text("PeoplePay360 — Payslip", { align: "center" });
  doc.moveDown();
  doc.fontSize(10)
     .text(`Employee: ${payslip.employee.fullName} (${payslip.employee.employeeCode})`)
     .text(`Period: ${formatDate(payslip.periodStart)} - ${formatDate(payslip.periodEnd)}`)
     .text(`Salary Structure: ${payslip.salaryStructure.name}`)
     .text(`Worked Days: ${payslip.workedDays}`)
     .text(`Status: ${payslip.status}`);
  doc.moveDown();

  // Simple table: Rule | Category | Amount
  payslip.lines.forEach(line => {
    doc.text(`${line.name} (${line.category})`, { continued: true });
    doc.text(`  ${line.amount.toFixed(2)}`, { align: "right" });
  });

  doc.moveDown();
  doc.fontSize(12).text(`Gross Salary: ${payslip.grossSalary.toFixed(2)}`);
  doc.text(`Total Deductions: ${payslip.totalDeductions.toFixed(2)}`);
  doc.font("Helvetica-Bold").text(`Net Salary: ${payslip.netSalary.toFixed(2)}`);

  doc.end();
}
```

This is generated **on-demand** (streamed directly to the HTTP response) — no persistent PDF storage is required for the "Print Payslip" action. For the bulk "Send Payslips" action, the same generator is reused but written to a buffer for email attachment (see below), and optionally cached to `backend/generated/payslips/<payslipId>.pdf` if regenerating on every send is a performance concern (**Recommended Implementation Decision**, not required for hackathon scale).

## 4. Bulk Email Flow

`POST /api/payruns/:id/send-payslips`:

```js
async function sendPayslipsForPayrun(payrunId) {
  const payslips = await Payslip.find({ payrun: payrunId }).populate("employee");
  const results = [];
  for (const payslip of payslips) {
    try {
      const pdfBuffer = await generatePayslipPdfBuffer(payslip._id);
      await mailerService.sendMail({
        to: payslip.employee.email,
        subject: `Your Payslip — ${formatMonthYear(payslip.periodStart)}`,
        text: `Dear ${payslip.employee.fullName}, please find attached your payslip for the period.`,
        attachments: [{ filename: `payslip-${payslip.employee.employeeCode}.pdf`, content: pdfBuffer }]
      });
      payslip.emailSentAt = new Date();
      await payslip.save();
      results.push({ employee: payslip.employee.fullName, status: "sent" });
    } catch (err) {
      results.push({ employee: payslip.employee.fullName, status: "failed", error: err.message });
    }
  }
  await Payrun.findByIdAndUpdate(payrunId, { payslipsSentAt: new Date() });
  return results;
}
```

**Per-employee failure isolation**: one failed send (e.g., invalid email) must not abort the batch. Return the full `results[]` array to the frontend so it can show a per-employee send-status summary (matches the "surface issues before/around finalization" spirit of the spec).

## 5. Nodemailer Transport Config (`mailer.service.js`)

```js
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

exports.sendMail = (options) => transporter.sendMail({ from: process.env.SMTP_FROM, ...options });
```

For local hackathon development/demo without real email delivery, point SMTP at a test service (e.g., Ethereal Email or Mailtrap sandbox) — configured entirely through `.env`, never hardcoded in source. This is a **Recommended Implementation Decision** since the official material does not mandate a specific provider.

## 6. Role Access

| Action | Roles |
|---|---|
| Print/view own PDF | Employee (own, `Paid` payslips only), HR Payroll User, HR Payroll Manager, Admin |
| Trigger bulk Send Payslips | HR Payroll User, HR Payroll Manager, Admin |

## 7. Failure/Edge Cases to Handle

- Employee has no email → skip and report as `failed` in the results array, do not crash the batch.
- SMTP not configured (`.env` values empty) in a local dev environment → `mailer.service.js` should throw a clear, caught error ("SMTP not configured") rather than an opaque Nodemailer stack trace, so the demo can still proceed showing the PDF generation working even if email sending is not configured for a given environment.
