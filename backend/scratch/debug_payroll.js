const mongoose = require('mongoose');
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

async function debug() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/odoo_db');

  console.log('=== STRUCTURES & RULES ===');
  const structures = await SalaryStructure.find({}).populate('rules');
  for (const s of structures) {
    console.log(`Structure: "${s.name}" (ID: ${s._id}) Status: ${s.status}`);
    console.log(`  Rules (${s.rules.length}):`);
    s.rules.forEach(r => {
      console.log(`    - ${r.name} [${r.code}] (${r.category}) Method: ${r.computationMethod} Amount: ${r.fixedAmount} %: ${r.percentageValue} Formula: "${r.formulaExpression}"`);
    });
  }

  console.log('\n=== MARCUS STERLING ===');
  const marcus = await Employee.findOne({ fullName: /Marcus Sterling/i }).populate('department jobPosition');
  if (marcus) {
    console.log('Employee:', marcus.fullName, marcus.employeeCode, 'Dept:', marcus.department?.name, 'Job:', marcus.jobPosition?.name);
    const contracts = await Contract.find({ employee: marcus._id }).populate('salaryStructure');
    for (const c of contracts) {
      console.log('Contract:', c.contractReference, 'Status:', c.status, 'Wage:', c.wagePerMonth, 'Structure:', c.salaryStructure?.name, 'Start:', c.startDate, 'End:', c.endDate);
    }

    const payslips = await Payslip.find({ employee: marcus._id }).populate('salaryStructure payrun');
    for (const p of payslips) {
      console.log('\nPayslip:', p._id, 'Status:', p.status, 'Payrun:', p.payrun?.name, 'Structure:', p.salaryStructure?.name, 'Gross:', p.grossSalary, 'Net:', p.netSalary);
      console.log('  Warnings:', p.warnings);
      console.log('  Lines (' + (p.lines ? p.lines.length : 0) + '):');
      if (p.lines) {
        p.lines.forEach(l => console.log(`    - ${l.name} [${l.code}] (${l.category}): ${l.amount}`));
      }
    }
  }

  process.exit(0);
}
debug();
