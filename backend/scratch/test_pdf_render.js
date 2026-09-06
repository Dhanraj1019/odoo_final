const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
require('dotenv').config({ path: './.env' });
require('../src/models/Department');
require('../src/models/JobPosition');
require('../src/models/WorkingSchedule');
const Employee = require('../src/models/Employee');
const Contract = require('../src/models/Contract');
const SalaryStructure = require('../src/models/SalaryStructure');
const SalaryRule = require('../src/models/SalaryRule');
const Payslip = require('../src/models/Payslip');
const Payrun = require('../src/models/Payrun');
const pdfService = require('../src/services/pdf.service');

async function testPdf() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/odoo_db');

  const marcus = await Employee.findOne({ fullName: /Marcus Sterling/i }).populate('department jobPosition');
  console.log('Marcus employee ID:', marcus._id, marcus.fullName);

  // Find a payslip for Marcus
  let payslip = await Payslip.findOne({ employee: marcus._id }).sort({ createdAt: -1 });
  console.log('Testing with payslip ID:', payslip._id, 'Status:', payslip.status);

  // Test preparePayslipPdfData
  const pdfData = await pdfService.preparePayslipPdfData(payslip._id);
  console.log('Prepared PDF data:', JSON.stringify(pdfData, null, 2));

  // Render to file
  const outputPath = path.join(__dirname, 'test_marcus_payslip.pdf');
  const writeStream = fs.createWriteStream(outputPath);

  const doc = new PDFDocument({ margin: 45, size: 'A4' });
  doc.pipe(writeStream);
  pdfService.renderPayslipPdf(pdfData, doc);
  doc.end();

  writeStream.on('finish', () => {
    console.log('✓ Successfully wrote test PDF to:', outputPath);
    console.log('PDF file size:', fs.statSync(outputPath).size, 'bytes');
    process.exit(0);
  });
}
testPdf();
