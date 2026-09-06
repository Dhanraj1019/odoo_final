const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
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
const payrollComputeService = require('../src/services/payrollCompute.service');
const pdfService = require('../src/services/pdf.service');

async function testE2E() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/odoo_db');
  console.log('Connected to DB for E2E validation');

  const marcus = await Employee.findOne({ fullName: /Marcus Sterling/i }).populate('department jobPosition');
  console.log('\n--- 1. EMPLOYEE VERIFICATION ---');
  console.log('Employee Name:', marcus.fullName);
  console.log('Employee Code:', marcus.employeeCode);
  console.log('Department:', marcus.department?.name);
  console.log('Designation:', marcus.jobPosition?.name);

  // Find structure E2E Executive Compensation
  const structure = await SalaryStructure.findOne({ name: /E2E Executive Compensation/i }).populate('rules');
  console.log('\n--- 2. SALARY STRUCTURE VERIFICATION ---');
  console.log('Structure ID:', structure._id);
  console.log('Structure Name:', structure.name);
  console.log('Rules Count:', structure.rules.length);
  structure.rules.forEach(r => {
    console.log(` - [${r.code}] ${r.name} (${r.category}) Type: ${r.computationMethod}`);
  });

  // Check Contract
  const contract = await Contract.findOne({ employee: marcus._id, status: 'Active' }).populate('salaryStructure');
  console.log('\n--- 3. CONTRACT VERIFICATION ---');
  console.log('Contract Ref:', contract.contractReference);
  console.log('Monthly Wage:', contract.wagePerMonth);
  console.log('Contract Status:', contract.status);

  // Create a new Payrun for Marcus Sterling with this structure
  console.log('\n--- 4. GENERATING NEW PAYROLL ---');
  const payrunResult = await payrollComputeService.createPayrun({
    name: 'E2E Validation Payrun October 2026',
    salaryStructure: structure._id,
    periodStart: '2026-10-01',
    periodEnd: '2026-10-31',
    selectedEmployees: [marcus._id]
  }, null);

  console.log('Created Payrun:', payrunResult.payrun._id, payrunResult.payrun.name, 'Status:', payrunResult.payrun.status);
  const marcusPayslipDraft = payrunResult.payslips[0];
  console.log('Created Draft Payslip:', marcusPayslipDraft._id);

  // Compute Payrun
  console.log('\n--- 5. COMPUTING PAYRUN ---');
  const computedPayrun = await payrollComputeService.computePayrun(payrunResult.payrun._id);
  console.log('Computed Payrun Status:', computedPayrun.status);

  const computedPayslip = await Payslip.findById(marcusPayslipDraft._id).populate('employee salaryStructure contract');
  console.log('Computed Payslip Lines Count:', computedPayslip.lines.length);
  console.log('Gross Salary:', computedPayslip.grossSalary);
  console.log('Total Deductions:', computedPayslip.totalDeductions);
  console.log('Net Salary:', computedPayslip.netSalary);
  console.table(computedPayslip.lines.map(l => ({ Code: l.code, Name: l.name, Category: l.category, Amount: l.amount })));

  // Generate PDF Data & Buffer
  console.log('\n--- 6. PDF PIPELINE VERIFICATION ---');
  const pdfData = await pdfService.preparePayslipPdfData(computedPayslip._id);
  console.log('PDF Data Structure Name:', pdfData.salaryStructure.name);
  console.log('PDF Data Lines Count:', pdfData.salaryLines.length);
  console.log('PDF Data Gross:', pdfData.totals.grossEarnings);
  console.log('PDF Data Deductions:', pdfData.totals.totalDeductions);
  console.log('PDF Data Net:', pdfData.totals.netPayable);

  const pdfBuffer = await pdfService.generatePayslipPdfBuffer(computedPayslip._id);
  console.log('Generated PDF buffer size:', pdfBuffer.length, 'bytes');

  // Verify buffer is valid PDF (starts with %PDF)
  const isPdfHeader = pdfBuffer.slice(0, 4).toString() === '%PDF';
  console.log('✓ Valid PDF Header (%PDF):', isPdfHeader);

  // Save generated PDF for inspection
  const outPdf = path.join(__dirname, 'marcus_october_verified.pdf');
  fs.writeFileSync(outPdf, pdfBuffer);
  console.log('✓ Saved verified PDF to:', outPdf);

  // Clean up test payrun & payslip
  await Payslip.findByIdAndDelete(marcusPayslipDraft._id);
  await Payrun.findByIdAndDelete(payrunResult.payrun._id);
  console.log('\n✓ Cleaned up test payrun and payslip');

  process.exit(0);
}
testE2E();
