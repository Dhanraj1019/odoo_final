const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });

const User = require("../models/User");
const Department = require("../models/Department");
const JobPosition = require("../models/JobPosition");
const WorkingSchedule = require("../models/WorkingSchedule");
const Employee = require("../models/Employee");
const Contract = require("../models/Contract");
const SalaryRule = require("../models/SalaryRule");
const SalaryStructure = require("../models/SalaryStructure");
const TimeOffType = require("../models/TimeOffType");
const TimeOffAllocation = require("../models/TimeOffAllocation");
const TimeOffRequest = require("../models/TimeOffRequest");
const Attendance = require("../models/Attendance");
const Payrun = require("../models/Payrun");
const Payslip = require("../models/Payslip");
const payrollComputeService = require("../services/payrollCompute.service");

const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/peoplepay360_db";

async function seed() {
  console.log("==================================================");
  console.log("   PEOPLEPAY360 — COMPREHENSIVE SEED DATA SCRIPT  ");
  console.log("==================================================");

  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB:", MONGO_URI);

  // 1. Clean existing collections
  console.log("\n[1/10] Clearing existing database collections...");
  await Promise.all([
    User.deleteMany({}),
    Department.deleteMany({}),
    JobPosition.deleteMany({}),
    WorkingSchedule.deleteMany({}),
    Employee.deleteMany({}),
    Contract.deleteMany({}),
    SalaryRule.deleteMany({}),
    SalaryStructure.deleteMany({}),
    TimeOffType.deleteMany({}),
    TimeOffAllocation.deleteMany({}),
    TimeOffRequest.deleteMany({}),
    Attendance.deleteMany({}),
    Payrun.deleteMany({}),
    Payslip.deleteMany({}),
  ]);
  console.log("✓ Database cleanly reset.");

  // 2. Create Departments
  console.log("\n[2/10] Creating Departments...");
  const departments = await Department.insertMany([
    { name: "Engineering", description: "Software development and engineering operations" },
    { name: "Human Resources", description: "Talent acquisition, employee relations, and HR ops" },
    { name: "Finance & Payroll", description: "Financial management, audits, and compensation" },
    { name: "Marketing", description: "Brand strategy, growth, and communications" },
    { name: "Operations", description: "Business operations, facilities, and logistics" },
  ]);
  const deptMap = Object.fromEntries(departments.map((d) => [d.name, d._id]));
  console.log(`✓ Created ${departments.length} departments.`);

  // 3. Create Job Positions
  console.log("\n[3/10] Creating Job Positions...");
  const jobPositions = await JobPosition.insertMany([
    { name: "Principal Software Architect", department: deptMap["Engineering"] },
    { name: "Senior Full Stack Engineer", department: deptMap["Engineering"] },
    { name: "Frontend Specialist", department: deptMap["Engineering"] },
    { name: "HR Director", department: deptMap["Human Resources"] },
    { name: "HR Operations Specialist", department: deptMap["Human Resources"] },
    { name: "Payroll Operations Lead", department: deptMap["Finance & Payroll"] },
    { name: "Payroll Specialist", department: deptMap["Finance & Payroll"] },
    { name: "Financial Analyst", department: deptMap["Finance & Payroll"] },
    { name: "Marketing Lead", department: deptMap["Marketing"] },
    { name: "Operations Coordinator", department: deptMap["Operations"] },
  ]);
  const jobMap = Object.fromEntries(jobPositions.map((j) => [j.name, j._id]));
  console.log(`✓ Created ${jobPositions.length} job positions.`);

  // 4. Create Working Schedules
  console.log("\n[4/10] Creating Working Schedules...");
  const standardDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => ({
    day,
    startTime: "09:00",
    endTime: "17:00",
    breakMinutes: 0,
  }));
  const standardSchedule = new WorkingSchedule({
    name: "Standard 40-Hour Schedule",
    days: standardDays,
    status: "Active",
  });
  await standardSchedule.save();

  const flexibleDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => ({
    day,
    startTime: "10:00",
    endTime: "18:00",
    breakMinutes: 0,
  }));
  const flexibleSchedule = new WorkingSchedule({
    name: "Flexible 40-Hour Shift",
    days: flexibleDays,
    status: "Active",
  });
  await flexibleSchedule.save();
  console.log("✓ Created Working Schedules (Standard & Flexible 40h).");

  // 5. Create Salary Rules & Salary Structure
  console.log("\n[5/10] Creating Salary Rules and Salary Structure...");
  const ruleBasic = await SalaryRule.create({
    name: "Basic Salary",
    code: "BASIC",
    category: "Basic",
    sequence: 10,
    computationMethod: "Fixed",
    fixedAmount: 0,
    status: "Active",
  });

  const ruleHra = await SalaryRule.create({
    name: "House Rent Allowance",
    code: "HRA",
    category: "Allowance",
    sequence: 20,
    computationMethod: "Percentage",
    percentageOf: "BASIC",
    percentageValue: 20,
    status: "Active",
  });

  const ruleConveyance = await SalaryRule.create({
    name: "Conveyance Allowance",
    code: "CONVEYANCE",
    category: "Allowance",
    sequence: 30,
    computationMethod: "Fixed",
    fixedAmount: 3000,
    status: "Active",
  });

  const ruleSpecial = await SalaryRule.create({
    name: "Special Allowance",
    code: "SPECIAL_ALLOWANCE",
    category: "Allowance",
    sequence: 40,
    computationMethod: "Formula",
    formulaExpression: "MAX(0, (CONTRACT_WAGE * 0.10) - 500)",
    status: "Active",
  });

  const ruleGross = await SalaryRule.create({
    name: "Gross Salary",
    code: "GROSS",
    category: "Gross",
    sequence: 50,
    computationMethod: "Formula",
    formulaExpression: "BASIC + HRA + CONVEYANCE + SPECIAL_ALLOWANCE",
    status: "Active",
  });

  const rulePf = await SalaryRule.create({
    name: "Provident Fund Deduction",
    code: "PF",
    category: "Deduction",
    sequence: 60,
    computationMethod: "Percentage",
    percentageOf: "BASIC",
    percentageValue: 12,
    status: "Active",
  });

  const ruleUnpaidDed = await SalaryRule.create({
    name: "Unpaid Leave Deduction",
    code: "UNPAID_LEAVE_DED",
    category: "Deduction",
    sequence: 70,
    computationMethod: "Formula",
    formulaExpression: "IF(UNPAID_LEAVE_DAYS > 0, (GROSS / TOTAL_WORKING_DAYS) * UNPAID_LEAVE_DAYS, 0)",
    status: "Active",
  });

  const ruleNet = await SalaryRule.create({
    name: "Net Salary",
    code: "NET",
    category: "Net",
    sequence: 80,
    computationMethod: "Formula",
    formulaExpression: "GROSS - PF - UNPAID_LEAVE_DED",
    status: "Active",
  });

  const salaryStructure = await SalaryStructure.create({
    name: "Standard Corporate Structure",
    description: "Standard executive & employee salary structure with allowances, PF, and unpaid leave deduction",
    rules: [
      ruleBasic._id,
      ruleHra._id,
      ruleConveyance._id,
      ruleSpecial._id,
      ruleGross._id,
      rulePf._id,
      ruleUnpaidDed._id,
      ruleNet._id,
    ],
    status: "Active",
  });
  console.log("✓ Created 8 Salary Rules and 'Standard Corporate Structure'.");

  // 6. Create Employees
  console.log("\n[6/10] Creating Employees and Contracts...");
  const employeesData = [
    {
      fullName: "Alexander Wright",
      employeeCode: "EMP-001",
      email: "alexander.wright@peoplepay360.local",
      phone: "+1-555-0101",
      department: deptMap["Engineering"],
      jobPosition: jobMap["Principal Software Architect"],
      workingSchedule: standardSchedule._id,
      employeeType: "Full-Time",
      status: "Active",
      dateOfJoining: new Date("2024-01-15"),
      bankDetails: { accountNumber: "98765432101", ifscOrRoutingCode: "PPB0001234", bankName: "Global Tech Bank" },
      wage: 150000,
    },
    {
      fullName: "Sophia Martinez",
      employeeCode: "EMP-002",
      email: "sophia.martinez@peoplepay360.local",
      phone: "+1-555-0102",
      department: deptMap["Engineering"],
      jobPosition: jobMap["Senior Full Stack Engineer"],
      workingSchedule: standardSchedule._id,
      employeeType: "Full-Time",
      status: "Active",
      dateOfJoining: new Date("2024-03-01"),
      bankDetails: { accountNumber: "98765432102", ifscOrRoutingCode: "PPB0001234", bankName: "Global Tech Bank" },
      wage: 120000,
    },
    {
      fullName: "Ethan Chen",
      employeeCode: "EMP-003",
      email: "ethan.chen@peoplepay360.local",
      phone: "+1-555-0103",
      department: deptMap["Engineering"],
      jobPosition: jobMap["Frontend Specialist"],
      workingSchedule: flexibleSchedule._id,
      employeeType: "Full-Time",
      status: "Active",
      dateOfJoining: new Date("2024-06-15"),
      bankDetails: { accountNumber: "98765432103", ifscOrRoutingCode: "PPB0001234", bankName: "Global Tech Bank" },
      wage: 95000,
    },
    {
      fullName: "Eleanor Vance",
      employeeCode: "EMP-004",
      email: "hrmanager@peoplepay360.local",
      phone: "+1-555-0104",
      department: deptMap["Human Resources"],
      jobPosition: jobMap["HR Director"],
      workingSchedule: standardSchedule._id,
      employeeType: "Full-Time",
      status: "Active",
      dateOfJoining: new Date("2023-11-01"),
      bankDetails: { accountNumber: "98765432104", ifscOrRoutingCode: "PPB0001234", bankName: "Global Tech Bank" },
      wage: 130000,
    },
    {
      fullName: "Lucas Rivera",
      employeeCode: "EMP-005",
      email: "lucas.rivera@peoplepay360.local",
      phone: "+1-555-0105",
      department: deptMap["Human Resources"],
      jobPosition: jobMap["HR Operations Specialist"],
      workingSchedule: standardSchedule._id,
      employeeType: "Full-Time",
      status: "Active",
      dateOfJoining: new Date("2024-08-01"),
      bankDetails: { accountNumber: "98765432105", ifscOrRoutingCode: "PPB0001234", bankName: "Global Tech Bank" },
      wage: 65000,
    },
    {
      fullName: "Marcus Sterling",
      employeeCode: "EMP-006",
      email: "payrollmanager@peoplepay360.local",
      phone: "+1-555-0106",
      department: deptMap["Finance & Payroll"],
      jobPosition: jobMap["Payroll Operations Lead"],
      workingSchedule: standardSchedule._id,
      employeeType: "Full-Time",
      status: "Active",
      dateOfJoining: new Date("2023-09-15"),
      bankDetails: { accountNumber: "98765432106", ifscOrRoutingCode: "PPB0001234", bankName: "Global Tech Bank" },
      wage: 125000,
    },
    {
      fullName: "Chloe Bennett",
      employeeCode: "EMP-007",
      email: "payrolluser@peoplepay360.local",
      phone: "+1-555-0107",
      department: deptMap["Finance & Payroll"],
      jobPosition: jobMap["Payroll Specialist"],
      workingSchedule: standardSchedule._id,
      employeeType: "Full-Time",
      status: "Active",
      dateOfJoining: new Date("2024-05-10"),
      bankDetails: { accountNumber: "98765432107", ifscOrRoutingCode: "PPB0001234", bankName: "Global Tech Bank" },
      wage: 75000,
    },
    {
      fullName: "David Kim",
      employeeCode: "EMP-008",
      email: "david.kim@peoplepay360.local",
      phone: "+1-555-0108",
      department: deptMap["Finance & Payroll"],
      jobPosition: jobMap["Financial Analyst"],
      workingSchedule: standardSchedule._id,
      employeeType: "Full-Time",
      status: "Active",
      dateOfJoining: new Date("2024-02-20"),
      bankDetails: { accountNumber: "98765432108", ifscOrRoutingCode: "PPB0001234", bankName: "Global Tech Bank" },
      wage: 88000,
    },
    {
      fullName: "Maya Patel",
      employeeCode: "EMP-009",
      email: "maya.patel@peoplepay360.local",
      phone: "+1-555-0109",
      department: deptMap["Marketing"],
      jobPosition: jobMap["Marketing Lead"],
      workingSchedule: standardSchedule._id,
      employeeType: "Full-Time",
      status: "Active",
      dateOfJoining: new Date("2024-04-12"),
      bankDetails: { accountNumber: "98765432109", ifscOrRoutingCode: "PPB0001234", bankName: "Global Tech Bank" },
      wage: 92000,
    },
    {
      fullName: "Oliver Grant",
      employeeCode: "EMP-010",
      email: "employee@peoplepay360.local",
      phone: "+1-555-0110",
      department: deptMap["Operations"],
      jobPosition: jobMap["Operations Coordinator"],
      workingSchedule: standardSchedule._id,
      employeeType: "Full-Time",
      status: "Active",
      dateOfJoining: new Date("2024-07-01"),
      bankDetails: { accountNumber: "98765432110", ifscOrRoutingCode: "PPB0001234", bankName: "Global Tech Bank" },
      wage: 60000,
    },
  ];

  const createdEmployees = [];
  for (const empData of employeesData) {
    const { wage, ...empFields } = empData;
    const emp = await Employee.create(empFields);
    createdEmployees.push(emp);

    // Create Contract
    await Contract.create({
      contractReference: `CON/2026/${emp.employeeCode.replace("EMP-", "")}`,
      employee: emp._id,
      department: emp.department,
      jobPosition: emp.jobPosition,
      startDate: new Date("2025-01-01"),
      endDate: null,
      wagePerMonth: wage,
      salaryStructure: salaryStructure._id,
      workingSchedule: emp.workingSchedule,
      status: "Active",
    });
  }
  console.log(`✓ Created ${createdEmployees.length} Employees and Active Contracts.`);

  // 7. Create Users for all 5 Canonical Roles
  console.log("\n[7/10] Creating 5 Canonical Users (Admin, HR Manager, HR Payroll Manager, HR Payroll User, Employee)...");
  const empLookup = Object.fromEntries(createdEmployees.map((e) => [e.email, e._id]));

  const usersData = [
    {
      fullName: "System Administrator",
      email: "admin@peoplepay360.local",
      password: "AdminPassword2026!",
      roles: ["Admin"],
      employee: null,
    },
    {
      fullName: "Eleanor Vance (HR Manager)",
      email: "hrmanager@peoplepay360.local",
      password: "HRManager2026!",
      roles: ["HR Manager"],
      employee: empLookup["hrmanager@peoplepay360.local"],
    },
    {
      fullName: "Marcus Sterling (Payroll Manager)",
      email: "payrollmanager@peoplepay360.local",
      password: "PayrollMgr2026!",
      roles: ["HR Payroll Manager"],
      employee: empLookup["payrollmanager@peoplepay360.local"],
    },
    {
      fullName: "Chloe Bennett (Payroll User)",
      email: "payrolluser@peoplepay360.local",
      password: "PayrollUser2026!",
      roles: ["HR Payroll User"],
      employee: empLookup["payrolluser@peoplepay360.local"],
    },
    {
      fullName: "Oliver Grant (Employee)",
      email: "employee@peoplepay360.local",
      password: "Employee2026!",
      roles: ["Employee"],
      employee: empLookup["employee@peoplepay360.local"],
    },
  ];

  for (const u of usersData) {
    const userDoc = new User(u);
    await userDoc.save();
  }
  console.log("✓ Created 5 Canonical Users with exact credentials.");

  // 8. Create Time Off Types, Allocations, and Requests
  console.log("\n[8/10] Creating Time Off Types, Allocations, and Requests...");
  const ptoType = await TimeOffType.create({
    name: "Paid Time Off",
    unit: "Days",
    requiresAllocation: true,
    requiresApproval: true,
    affectsPayroll: false,
    isPaid: true,
    status: "Active",
  });

  const sickType = await TimeOffType.create({
    name: "Sick Leave",
    unit: "Days",
    requiresAllocation: true,
    requiresApproval: true,
    affectsPayroll: false,
    isPaid: true,
    status: "Active",
  });

  const unpaidType = await TimeOffType.create({
    name: "Unpaid Leave",
    unit: "Days",
    requiresAllocation: false,
    requiresApproval: true,
    affectsPayroll: true,
    isPaid: false,
    status: "Active",
  });

  // Allocations for each employee
  for (const emp of createdEmployees) {
    await TimeOffAllocation.create({
      employee: emp._id,
      timeOffType: ptoType._id,
      allocatedAmount: 20,
      takenAmount: 2,
      validFrom: new Date("2026-01-01"),
      validTo: new Date("2026-12-31"),
      status: "Approved",
    });

    await TimeOffAllocation.create({
      employee: emp._id,
      timeOffType: sickType._id,
      allocatedAmount: 10,
      takenAmount: 1,
      validFrom: new Date("2026-01-01"),
      validTo: new Date("2026-12-31"),
      status: "Approved",
    });
  }

  // Sample approved/submitted Time Off Requests
  const hrUser = await User.findOne({ email: "hrmanager@peoplepay360.local" });

  await TimeOffRequest.create({
    employee: createdEmployees[0]._id, // Alexander Wright
    timeOffType: ptoType._id,
    startDate: new Date("2026-01-12"),
    endDate: new Date("2026-01-13"),
    duration: 2,
    status: "Approved",
    approvedBy: hrUser._id,
    actionedAt: new Date("2026-01-10"),
    reason: "Personal family event",
  });

  await TimeOffRequest.create({
    employee: createdEmployees[1]._id, // Sophia Martinez
    timeOffType: unpaidType._id,
    startDate: new Date("2026-02-16"),
    endDate: new Date("2026-02-17"),
    duration: 2,
    status: "Approved",
    approvedBy: hrUser._id,
    actionedAt: new Date("2026-02-14"),
    reason: "Unpaid leave for personal travel",
  });

  await TimeOffRequest.create({
    employee: createdEmployees[2]._id, // Ethan Chen
    timeOffType: ptoType._id,
    startDate: new Date("2026-03-20"),
    endDate: new Date("2026-03-24"),
    duration: 3,
    status: "Submitted",
    reason: "Upcoming vacation",
  });
  console.log("✓ Created Time Off Types, Allocations, and Requests.");

  // 9. Create Attendance History (Jan, Feb, Mar 2026)
  console.log("\n[9/10] Creating Attendance records...");
  const attendanceDocs = [];
  const daysInJan = [5, 6, 7, 8, 9, 12, 13, 14, 15, 16, 19, 20, 21, 22, 23, 26, 27, 28, 29, 30]; // Weekdays Jan 2026
  const daysInFeb = [2, 3, 4, 5, 6, 9, 10, 11, 12, 13, 16, 17, 18, 19, 20, 23, 24, 25, 26, 27]; // Weekdays Feb 2026
  const daysInMar = [2, 3, 4, 5]; // Recent weekdays

  for (const emp of createdEmployees) {
    // Jan attendance
    for (const d of daysInJan) {
      const date = new Date(Date.UTC(2026, 0, d, 0, 0, 0, 0));
      attendanceDocs.push({
        employee: emp._id,
        date,
        checkIn: new Date(Date.UTC(2026, 0, d, 9, 0, 0, 0)),
        checkOut: new Date(Date.UTC(2026, 0, d, 17, 0, 0, 0)),
        workedHours: 8,
        status: "Present",
      });
    }

    // Feb attendance
    for (const d of daysInFeb) {
      const date = new Date(Date.UTC(2026, 1, d, 0, 0, 0, 0));
      if (emp.fullName === "Sophia Martinez" && (d === 16 || d === 17)) {
        // Unpaid leave on Feb 16 & 17
        attendanceDocs.push({
          employee: emp._id,
          date,
          checkIn: null,
          checkOut: null,
          workedHours: 0,
          status: "Absent",
        });
      } else if (d === 10 && emp.fullName === "Ethan Chen") {
        // Late on Feb 10
        attendanceDocs.push({
          employee: emp._id,
          date,
          checkIn: new Date(Date.UTC(2026, 1, d, 9, 45, 0, 0)),
          checkOut: new Date(Date.UTC(2026, 1, d, 17, 0, 0, 0)),
          workedHours: 7.25,
          status: "Late",
        });
      } else {
        attendanceDocs.push({
          employee: emp._id,
          date,
          checkIn: new Date(Date.UTC(2026, 1, d, 9, 0, 0, 0)),
          checkOut: new Date(Date.UTC(2026, 1, d, 17, 0, 0, 0)),
          workedHours: 8,
          status: "Present",
        });
      }
    }

    // Mar attendance
    for (const d of daysInMar) {
      const date = new Date(Date.UTC(2026, 2, d, 0, 0, 0, 0));
      attendanceDocs.push({
        employee: emp._id,
        date,
        checkIn: new Date(Date.UTC(2026, 2, d, 9, 0, 0, 0)),
        checkOut: new Date(Date.UTC(2026, 2, d, 17, 0, 0, 0)),
        workedHours: 8,
        status: "Present",
      });
    }
  }

  await Attendance.insertMany(attendanceDocs);
  console.log(`✓ Created ${attendanceDocs.length} Attendance records across 3 months.`);

  // 10. Create Payruns and Payslips (Jan Paid, Feb Paid, Mar Computed)
  console.log("\n[10/10] Generating Payruns and Payslips...");
  const adminUser = await User.findOne({ email: "admin@peoplepay360.local" });
  const allEmpIds = createdEmployees.map((e) => e._id);

  // Payrun 1: January 2026 (Paid)
  const { payrun: janPayrun } = await payrollComputeService.createPayrun(
    {
      salaryStructure: salaryStructure._id,
      periodStart: new Date("2026-01-01"),
      periodEnd: new Date("2026-01-31"),
      employeeType: "All",
      selectedEmployees: allEmpIds,
    },
    adminUser._id
  );
  await payrollComputeService.computePayrun(janPayrun._id);
  await payrollComputeService.validatePayrun(janPayrun._id);
  await payrollComputeService.markPaid(janPayrun._id);

  // Payrun 2: February 2026 (Paid)
  const { payrun: febPayrun } = await payrollComputeService.createPayrun(
    {
      salaryStructure: salaryStructure._id,
      periodStart: new Date("2026-02-01"),
      periodEnd: new Date("2026-02-28"),
      employeeType: "All",
      selectedEmployees: allEmpIds,
    },
    adminUser._id
  );
  await payrollComputeService.computePayrun(febPayrun._id);
  await payrollComputeService.validatePayrun(febPayrun._id);
  await payrollComputeService.markPaid(febPayrun._id);

  // Payrun 3: March 2026 (Computed)
  const { payrun: marPayrun } = await payrollComputeService.createPayrun(
    {
      salaryStructure: salaryStructure._id,
      periodStart: new Date("2026-03-01"),
      periodEnd: new Date("2026-03-31"),
      employeeType: "All",
      selectedEmployees: allEmpIds,
    },
    adminUser._id
  );
  await payrollComputeService.computePayrun(marPayrun._id);

  console.log("✓ Created 3 Payruns: Jan 2026 (Paid), Feb 2026 (Paid), Mar 2026 (Computed).");

  // Summary counts
  console.log("\n==================================================");
  console.log("   SEED DATA POPULATION SUMMARY                   ");
  console.log("==================================================");
  console.log("Departments:      ", await Department.countDocuments());
  console.log("Job Positions:    ", await JobPosition.countDocuments());
  console.log("Working Schedules:", await WorkingSchedule.countDocuments());
  console.log("Employees:        ", await Employee.countDocuments());
  console.log("Contracts:        ", await Contract.countDocuments());
  console.log("Users:            ", await User.countDocuments());
  console.log("Salary Rules:     ", await SalaryRule.countDocuments());
  console.log("Salary Structures:", await SalaryStructure.countDocuments());
  console.log("Time Off Types:   ", await TimeOffType.countDocuments());
  console.log("Time Off Alloc.:  ", await TimeOffAllocation.countDocuments());
  console.log("Time Off Requests:", await TimeOffRequest.countDocuments());
  console.log("Attendance:       ", await Attendance.countDocuments());
  console.log("Payruns:          ", await Payrun.countDocuments());
  console.log("Payslips:         ", await Payslip.countDocuments());
  console.log("==================================================");
  console.log("Canonical Login Credentials:");
  console.log("  Admin:               admin@peoplepay360.local          / AdminPassword2026!");
  console.log("  HR Manager:          hrmanager@peoplepay360.local      / HRManager2026!");
  console.log("  HR Payroll Manager:  payrollmanager@peoplepay360.local / PayrollMgr2026!");
  console.log("  HR Payroll User:     payrolluser@peoplepay360.local    / PayrollUser2026!");
  console.log("  Employee:            employee@peoplepay360.local       / Employee2026!");
  console.log("==================================================");

  await mongoose.disconnect();
  console.log("Disconnected from MongoDB. Seeding Complete.");
}

if (require.main === module) {
  seed().catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  });
}

module.exports = seed;
