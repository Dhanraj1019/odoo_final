# 06 — Database Design (MongoDB / Mongoose)

Database: `mongodb://127.0.0.1:27017/peoplepay360_db`

## 1. Collection Overview

| Collection | Purpose |
|---|---|
| `users` | Login accounts, roles, link to employee |
| `employees` | Employee master data |
| `departments` | Department master list |
| `jobpositions` | Job position master list |
| `contracts` | Historical employment contracts |
| `workingschedules` | Weekly time patterns |
| `attendances` | Daily attendance records |
| `timeofftypes` | Leave type configuration |
| `timeoffallocations` | Employee leave balances |
| `timeoffrequests` | Leave requests |
| `salarystructures` | Container of ordered salary rules |
| `salaryrules` | Individual computation rules |
| `payruns` | Payroll batch per period |
| `payslips` | Individual employee payslip within a payrun |
| `sessions` | Managed automatically by `connect-mongo` |

Avoid creating extra collections beyond this list (per the "do not over-engineer" constraint). `departments`/`jobpositions` may be simplified to plain string fields on `Employee`/`Contract` if time is short — **Recommended Implementation Decision**: keep them as tiny reference collections since the dashboard needs "Salary Cost by Department" grouping and consistent department names.

---

## 2. `users`

```js
{
  _id: ObjectId,
  fullName: String,           // required
  email: String,              // required, unique, lowercase
  passwordHash: String,       // required, bcrypt
  roles: [String],            // required, enum of the 5 roles, min 1
  employee: ObjectId,         // ref: 'Employee', optional (Admin might not need one, but typically linked)
  isActive: Boolean,          // default true — Admin can deactivate instead of delete
  createdBy: ObjectId,        // ref: 'User' (the Admin who created this account)
  createdAt: Date,
  updatedAt: Date
}
```

- Indexes: unique index on `email`.
- No public registration endpoint touches this collection — only Admin-guarded routes (`09-AUTHENTICATION-AND-USER-MANAGEMENT.md`).

## 3. `departments`

```js
{
  _id: ObjectId,
  name: String,     // required, unique
  createdAt: Date,
  updatedAt: Date
}
```

## 4. `jobpositions`

```js
{
  _id: ObjectId,
  title: String,          // required
  department: ObjectId,   // ref: 'Department'
  createdAt: Date,
  updatedAt: Date
}
```

## 5. `employees`

```js
{
  _id: ObjectId,
  fullName: String,           // required
  employeeCode: String,       // required, unique, e.g. "EMP-0001"
  email: String,               // required, unique
  phone: String,
  department: ObjectId,        // ref: 'Department'
  jobPosition: ObjectId,       // ref: 'JobPosition'
  manager: ObjectId,           // ref: 'Employee', optional (self-reference)
  workingSchedule: ObjectId,   // ref: 'WorkingSchedule'
  employeeType: String,        // enum: 'Full-Time' | 'Part-Time' | 'Contract'
  status: String,              // enum: 'Active' | 'Inactive' | 'Terminated', default 'Active'
  dateOfJoining: Date,
  bankDetails: {
    accountNumber: String,
    ifscOrRoutingCode: String,
    bankName: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

- Indexes: unique index on `employeeCode`, unique index on `email`.
- Validation: `bankDetails` presence is checked by payroll as a **warning condition**, not a hard schema requirement (an employee can exist without bank details, but a Payrun should flag it — see `15-PAYROLL-ARCHITECTURE.md`).
- Relationship: `Employee.workingSchedule` is the **default** schedule; `Contract.workingSchedule` (if set) overrides it for payroll/attendance purposes during that contract's term (**Assumption**, since the mockup allows assignment "to an Employee/Contract").

## 6. `contracts`

```js
{
  _id: ObjectId,
  employee: ObjectId,          // ref: 'Employee', required
  department: ObjectId,        // ref: 'Department'
  jobPosition: ObjectId,       // ref: 'JobPosition'
  startDate: Date,             // required
  endDate: Date,                // null = open-ended
  wagePerMonth: Number,        // required
  salaryStructure: ObjectId,   // ref: 'SalaryStructure', required
  workingSchedule: ObjectId,   // ref: 'WorkingSchedule', optional override
  status: String,              // enum: 'Draft' | 'Active' | 'Expired' | 'Cancelled'
  contractReference: String,   // e.g. "COM/2026/0042", auto-generated
  createdAt: Date,
  updatedAt: Date
}
```

- Indexes: compound index on `{ employee: 1, startDate: -1 }`.
- **Business rule (service-layer, not schema-enforced):** an employee should not have two contracts with `status: 'Active'` whose date ranges overlap. Enforce in `ContractService.create/update` — reject or warn (Recommended Implementation Decision: **reject** with a clear validation error, since the spec says "avoiding concurrent active contracts").
- **Period-applicable contract lookup:** `Contract.findOne({ employee, status: 'Active', startDate: { $lte: periodEnd }, $or: [{ endDate: null }, { endDate: { $gte: periodStart } }] })`.

## 7. `workingschedules`

```js
{
  _id: ObjectId,
  name: String,          // required, e.g. "40 Hours / Week"
  company: String,       // default "My Company" (single-company assumption)
  days: [
    {
      day: String,        // enum: 'Monday'..'Sunday'
      startTime: String,  // "HH:mm"
      endTime: String,    // "HH:mm"
      breakMinutes: Number // default 0
    }
  ],
  totalWeeklyHours: Number,  // computed & stored on save, never entered manually
  status: String,             // enum: 'Active' | 'Archived', default 'Active'
  createdAt: Date,
  updatedAt: Date
}
```

- `totalWeeklyHours` is calculated in a Mongoose `pre('save')` hook: sum over `days` of `(endTime - startTime) - breakMinutes`, converted to hours.

## 8. `attendances`

```js
{
  _id: ObjectId,
  employee: ObjectId,     // ref: 'Employee', required
  date: Date,              // required, date-only (normalized to midnight)
  checkIn: Date,           // datetime
  checkOut: Date,          // datetime, null while checked-in
  workedHours: Number,     // computed on checkOut
  status: String,          // enum: 'Present' | 'Late' | 'Absent' | 'On Leave' | 'Half Day'
  isManualCorrection: Boolean, // default false
  correctedBy: ObjectId,   // ref: 'User', set when isManualCorrection = true
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

- Indexes: unique compound index on `{ employee: 1, date: 1 }` (one attendance record per employee per day).
- `status` derivation (Recommended Implementation Decision, since exact policy is open to interpretation):
  - No `checkIn` for a working day → `Absent`.
  - `checkIn` after the schedule's start time + grace period (e.g., 15 min) → `Late`.
  - Otherwise → `Present`.
  - `workedHours < scheduled hours / 2` → may be flagged `Half Day` (optional, stretch).
- Manual corrections restricted to `HR Manager, HR Payroll User, HR Payroll Manager, Admin` (never `Employee`).

## 9. `timeofftypes`

```js
{
  _id: ObjectId,
  name: String,               // required, e.g. "Paid Time Off"
  unit: String,                // enum: 'Days' | 'Hours', required
  requiresAllocation: Boolean, // default true
  requiresApproval: Boolean,   // default true
  affectsPayroll: Boolean,     // default true — whether unpaid/paid status feeds the formula engine
  isPaid: Boolean,              // default true; false = unpaid leave
  status: String,               // enum: 'Active' | 'Archived'
  createdAt: Date,
  updatedAt: Date
}
```

## 10. `timeoffallocations`

```js
{
  _id: ObjectId,
  employee: ObjectId,        // ref: 'Employee', required
  timeOffType: ObjectId,     // ref: 'TimeOffType', required
  allocatedAmount: Number,   // required
  takenAmount: Number,        // default 0, auto-updated when requests are approved
  validFrom: Date,
  validTo: Date,
  status: String,             // enum: 'Pending Approval' | 'Approved' | 'Expired', default 'Pending Approval'
  createdAt: Date,
  updatedAt: Date
}
```

- `remainingAmount` is a virtual: `allocatedAmount - takenAmount`.
- An allocation only counts toward available balance once `status: 'Approved'`.

## 11. `timeoffrequests`

```js
{
  _id: ObjectId,
  employee: ObjectId,        // ref: 'Employee', required
  timeOffType: ObjectId,     // ref: 'TimeOffType', required
  startDate: Date,            // required
  endDate: Date,               // required
  duration: Number,            // computed: days or hours depending on type.unit
  status: String,              // enum: 'Submitted' | 'Approved' | 'Refused', default 'Submitted'
  approvedBy: ObjectId,        // ref: 'User', set on approval/refusal
  actionedAt: Date,
  reason: String,
  createdAt: Date,
  updatedAt: Date
}
```

- On transition to `Approved` (for types with `requiresAllocation: true`): increment the matching `TimeOffAllocation.takenAmount` by `duration`, only if sufficient `remainingAmount` exists — otherwise reject the approval with a validation error.

## 12. `salarystructures`

```js
{
  _id: ObjectId,
  name: String,          // required, e.g. "Regular Salary"
  description: String,
  rules: [ObjectId],     // ref: 'SalaryRule', ordered array = execution sequence
  status: String,         // enum: 'Active' | 'Archived'
  createdAt: Date,
  updatedAt: Date
}
```

- Virtuals: `ruleCount` (length of `rules`), `employeeCount` (count of `Contract`s referencing this structure, computed via a lookup — not stored).

## 13. `salaryrules`

```js
{
  _id: ObjectId,
  name: String,             // required, e.g. "House Rent Allowance"
  code: String,              // required, unique, UPPER_SNAKE, e.g. "HRA"
  category: String,          // enum: 'Basic' | 'Allowance' | 'Gross' | 'Deduction' | 'Net', required
  sequence: Number,          // required, display/default-ordering metadata ONLY — see note below
  computationMethod: String, // enum: 'Fixed' | 'Percentage' | 'Formula', required
  fixedAmount: Number,       // used when computationMethod = 'Fixed'
  percentageOf: String,      // used when computationMethod = 'Percentage' — a rule code or 'CONTRACT_WAGE'
  percentageValue: Number,   // e.g. 20 for 20%
  formulaExpression: String, // used when computationMethod = 'Formula' — safe DSL string, see doc 16
  status: String,             // enum: 'Active' | 'Archived'
  createdAt: Date,
  updatedAt: Date
}
```

- Indexes: unique index on `code`.
- Validation (service layer): exactly one of `fixedAmount` / `percentageOf`+`percentageValue` / `formulaExpression` must be populated, matching `computationMethod`.
- **Execution-order source of truth:** `SalaryStructure.rules[]` array order is the **only** thing that determines actual compute-time execution order and formula-reference validity. `SalaryRule.sequence` is display/default-ordering metadata (e.g., pre-filling a sensible position when a rule is first added to a structure) and must never be read by the compute engine or the circular-dependency validator. See `16-PAYROLL-FORMULA-ENGINE.md` §7.

## 14. `payruns`

```js
{
  _id: ObjectId,
  name: String,               // e.g. "February 2026", derived from period
  salaryStructure: ObjectId,  // ref: 'SalaryStructure', required
  periodStart: Date,           // required
  periodEnd: Date,              // required
  employeeType: String,        // optional scope filter used at creation, e.g. 'Full-Time' | 'All'
  department: ObjectId,        // optional scope filter
  selectedEmployees: [ObjectId], // ref: 'Employee' — locked in at "Create Payrun" step
  status: String,               // enum: 'Draft' | 'Computed' | 'Validated' | 'Paid', default 'Draft'
  warnings: [String],           // computed snapshot of warnings at last compute/validate
  createdBy: ObjectId,          // ref: 'User'
  computedAt: Date,
  validatedAt: Date,
  paidAt: Date,
  payslipsSentAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## 15. `payslips`

```js
{
  _id: ObjectId,
  payrun: ObjectId,           // ref: 'Payrun', required
  employee: ObjectId,          // ref: 'Employee', required
  contract: ObjectId,          // ref: 'Contract', required — the period-applicable contract used
  salaryStructure: ObjectId,   // ref: 'SalaryStructure', required
  periodStart: Date,
  periodEnd: Date,
  workedDays: Number,
  unpaidLeaveDays: Number,
  overtimeHours: Number,
  lines: [
    {
      salaryRule: ObjectId,   // ref: 'SalaryRule'
      code: String,
      name: String,
      category: String,
      amount: Number
    }
  ],
  grossSalary: Number,
  totalDeductions: Number,
  netSalary: Number,
  status: String,              // enum: 'Draft' | 'Computed' | 'Validated' | 'Paid', default 'Draft'
  warnings: [String],          // e.g. "Missing bank details", "Duplicate payslip for period"
  pdfGeneratedAt: Date,
  emailSentAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

- Indexes: compound unique index on `{ employee: 1, periodStart: 1, periodEnd: 1 }` to prevent duplicate payslips for the same employee/period — this is exactly the "duplicate payslip" warning condition the dashboard/payrun screen must surface **before** it would otherwise become a hard failure; check for the duplicate proactively in the compute service and add to `warnings` rather than letting the unique index throw an unhandled error.

## 16. Entity Relationship Summary

```
Employee 1---N Contract
Employee 1---1 WorkingSchedule (default)
Contract N---1 WorkingSchedule (override, optional)
Contract N---1 SalaryStructure
Employee 1---N Attendance
Employee 1---N TimeOffAllocation
Employee 1---N TimeOffRequest
TimeOffRequest N---1 TimeOffType
TimeOffAllocation N---1 TimeOffType
SalaryStructure 1---N SalaryRule (via ordered rules[] array)
Payrun 1---N Payslip
Payslip N---1 Employee
Payslip N---1 Contract
Payslip N---1 SalaryStructure
User 1---1 Employee (optional link; Admin accounts may have no linked employee)
```

## 17. Seed / Demo Data Requirement

Per the official deliverables ("populated with representative data"), a seed script (`backend/src/utils/seed.js` or similar) must create: a handful of departments, job positions, working schedules, ~10-20 employees across roles, contracts, a salary structure with 4-6 rules (Basic, HRA, Transport Allowance, PF Deduction, Gross, Net), some attendance history, time off types/allocations/requests, and at least one fully processed (Paid) Payrun with Payslips — enough to make the dashboard show meaningful non-empty charts. This is tracked as its own task in `22-BACKEND-TODO.md`.
