# 08 — API Contracts

Base URL: `/api`. All responses use the standard envelope from `07-BACKEND-ARCHITECTURE.md` §7. All endpoints require an authenticated session unless marked **Public**. Role lists reference `05-RBAC-ROLES-PERMISSIONS.md`.

## 1. Auth

### `POST /api/auth/login` — Public
Body: `{ email, password }`
Success: `200 { success: true, data: { user } }` (sets session cookie)
Errors: `401` invalid credentials.

### `POST /api/auth/logout`
No body. Destroys session, clears cookie. `200 { success: true }`

### `GET /api/auth/me`
Returns the current session user (or `401` if none). `200 { success: true, data: { user } }`

## 2. Users (Admin only)

| Method | Endpoint | Roles | Body / Notes |
|---|---|---|---|
| GET | `/api/users` | Admin | query: `?search=&role=&status=` |
| GET | `/api/users/:id` | Admin | |
| POST | `/api/users` | Admin | `{ fullName, email, password, roles: [], employeeId? }` |
| PUT | `/api/users/:id` | Admin | `{ fullName?, roles?, employeeId?, isActive? }` |
| PUT | `/api/users/:id/reset-password` | Admin | `{ newPassword }` |
| DELETE | `/api/users/:id` | Admin | soft-delete via `isActive:false` preferred over hard delete |

## 3. Employees

| Method | Endpoint | Roles | Notes |
|---|---|---|---|
| GET | `/api/employees` | HR Manager, HR Payroll User, HR Payroll Manager, Admin | list/kanban data, query: `?department=&status=&search=` |
| GET | `/api/employees/me` | Employee (+ all above) | current user's own employee record |
| GET | `/api/employees/:id` | HR Manager, HR Payroll User, HR Payroll Manager, Admin | full record |
| POST | `/api/employees` | HR Manager, HR Payroll User, HR Payroll Manager, Admin | create |
| PUT | `/api/employees/:id` | HR Manager, HR Payroll User, HR Payroll Manager, Admin | update |
| DELETE | `/api/employees/:id` | HR Manager, HR Payroll User, HR Payroll Manager, Admin | soft-delete (`status: 'Terminated'`) preferred |

Employee body:
```json
{
  "fullName": "Aarav Mehta",
  "employeeCode": "EMP-0012",
  "email": "aarav@company.com",
  "department": "<departmentId>",
  "jobPosition": "<jobPositionId>",
  "manager": "<employeeId>",
  "workingSchedule": "<workingScheduleId>",
  "employeeType": "Full-Time",
  "dateOfJoining": "2025-01-10",
  "bankDetails": { "accountNumber": "...", "ifscOrRoutingCode": "...", "bankName": "..." }
}
```

## 4. Departments & Job Positions

Simple CRUD, same role set as Employees:
```
GET/POST /api/departments
PUT/DELETE /api/departments/:id
GET/POST /api/job-positions
PUT/DELETE /api/job-positions/:id
```

## 5. Contracts

| Method | Endpoint | Roles | Notes |
|---|---|---|---|
| GET | `/api/contracts?employee=<id>` | HR Manager, HR Payroll User, HR Payroll Manager, Admin | filterable by employee |
| GET | `/api/contracts/:id` | same | |
| POST | `/api/contracts` | same | rejects if overlapping active contract exists for the employee |
| PUT | `/api/contracts/:id` | same | same overlap check on date/status change |
| DELETE | `/api/contracts/:id` | same | |

Contract body:
```json
{
  "employee": "<employeeId>",
  "department": "<departmentId>",
  "jobPosition": "<jobPositionId>",
  "startDate": "2026-01-01",
  "endDate": null,
  "wagePerMonth": 60000,
  "salaryStructure": "<salaryStructureId>",
  "workingSchedule": "<workingScheduleId>",
  "status": "Active"
}
```
Error case: `409 { success: false, message: "Employee already has an overlapping active contract" }`

## 6. Working Schedules

```
GET/POST /api/working-schedules
GET/PUT/DELETE /api/working-schedules/:id
```
Roles: HR Manager, HR Payroll User, HR Payroll Manager, Admin (read-only view is also exposed to `Employee` for their own assigned schedule via `GET /api/employees/me`, not as a separate route).

Body:
```json
{
  "name": "40 Hours / Week",
  "days": [
    { "day": "Monday", "startTime": "09:00", "endTime": "18:00", "breakMinutes": 60 }
  ]
}
```
`totalWeeklyHours` is server-computed and returned; never accepted as input.

## 7. Attendance

| Method | Endpoint | Roles | Notes |
|---|---|---|---|
| GET | `/api/attendance?employee=&from=&to=` | HR Manager+ (all employees); Employee (own only, enforced server-side ignoring `employee` param) | |
| GET | `/api/attendance/:id` | same rules | |
| POST | `/api/attendance/check-in` | Employee, HR Manager+ | `{ }` — uses `req.user.employee`; creates/updates today's record |
| POST | `/api/attendance/check-out` | Employee, HR Manager+ | `{ }` — closes today's open record, computes `workedHours` |
| POST | `/api/attendance` | HR Manager, HR Payroll User, HR Payroll Manager, Admin | manual creation for any employee |
| PUT | `/api/attendance/:id` | HR Manager, HR Payroll User, HR Payroll Manager, Admin | manual correction, sets `isManualCorrection: true`, `correctedBy: req.user._id` |
| DELETE | `/api/attendance/:id` | HR Manager, HR Payroll User, HR Payroll Manager, Admin | |

## 8. Time Off Types

```
GET/POST /api/time-off-types            (HR Manager, HR Payroll User, HR Payroll Manager, Admin)
GET/PUT/DELETE /api/time-off-types/:id  (same)
```

## 9. Time Off Allocations

```
GET /api/time-off-allocations?employee=       (HR Manager+; Employee restricted to own)
GET /api/time-off-allocations/:id
POST /api/time-off-allocations                (HR Manager, HR Payroll User, HR Payroll Manager, Admin)
PUT /api/time-off-allocations/:id/approve      (HR Manager, HR Payroll User, HR Payroll Manager, Admin)
PUT /api/time-off-allocations/:id
DELETE /api/time-off-allocations/:id
```

## 10. Time Off Requests

| Method | Endpoint | Roles | Notes |
|---|---|---|---|
| GET | `/api/time-off-requests?employee=&status=` | HR Manager+ (all); Employee (own only) | |
| GET | `/api/time-off-requests/:id` | same | |
| POST | `/api/time-off-requests` | Employee, HR Manager+ | `{ timeOffType, startDate, endDate, reason }`; `employee` derived from session for Employee role |
| PUT | `/api/time-off-requests/:id/approve` | HR Manager, HR Payroll User, HR Payroll Manager, Admin | deducts allocation; fails with `409` if insufficient balance |
| PUT | `/api/time-off-requests/:id/refuse` | same | `{ reason? }` |
| DELETE | `/api/time-off-requests/:id` | requester (if still `Submitted`) or HR Manager+ | |

## 11. Salary Structures

```
GET  /api/salary-structures              (HR Payroll User [read], HR Payroll Manager, Admin)
GET  /api/salary-structures/:id
POST /api/salary-structures              (HR Payroll Manager, Admin)
PUT  /api/salary-structures/:id          (HR Payroll Manager, Admin)
DELETE /api/salary-structures/:id        (HR Payroll Manager, Admin)
```
Body:
```json
{ "name": "Regular Salary", "description": "...", "rules": ["<salaryRuleId>", "<salaryRuleId>"] }
```
`rules` array order = execution sequence and overrides individual `SalaryRule.sequence` display ordering for this structure's computation pass.

## 12. Salary Rules

```
GET  /api/salary-rules                   (HR Payroll User [read], HR Payroll Manager, Admin)
GET  /api/salary-rules/:id
POST /api/salary-rules                   (HR Payroll Manager, Admin)
PUT  /api/salary-rules/:id               (HR Payroll Manager, Admin)
DELETE /api/salary-rules/:id             (HR Payroll Manager, Admin)
```
Body (Formula example):
```json
{
  "name": "Overtime Pay",
  "code": "OT_PAY",
  "category": "Allowance",
  "sequence": 40,
  "computationMethod": "Formula",
  "formulaExpression": "OVERTIME_HOURS * (BASIC / 30 / 8) * 1.5"
}
```
See `16-PAYROLL-FORMULA-ENGINE.md` for the full expression grammar.

## 13. Payruns

| Method | Endpoint | Roles | Notes |
|---|---|---|---|
| GET | `/api/payruns` | HR Payroll User, HR Payroll Manager, Admin | list, filter by status/period |
| GET | `/api/payruns/:id` | same | includes populated payslip summary |
| GET | `/api/payruns/eligible-employees?salaryStructure=&periodStart=&periodEnd=&department=&employeeType=` | same | **Step 2 of wizard** — returns candidate employees before Payrun exists |
| POST | `/api/payruns` | same | **only called at "Create Payrun"** — body includes `selectedEmployees[]`; creates Payrun + one Draft Payslip per employee in one transaction-like sequence |
| POST | `/api/payruns/:id/compute` | same | runs formula engine for every payslip in the run, sets `status: 'Computed'`, populates `warnings` |
| POST | `/api/payruns/:id/validate` | same | re-checks warnings are resolved/acknowledged, sets `status: 'Validated'` |
| POST | `/api/payruns/:id/mark-paid` | same | sets `status: 'Paid'`, `paidAt: now`, cascades payslip statuses to `Paid` |
| POST | `/api/payruns/:id/send-payslips` | same | triggers Nodemailer bulk send, sets `payslipsSentAt` |
| DELETE | `/api/payruns/:id` | HR Payroll Manager, Admin | only allowed while `status: 'Draft'` |

`POST /api/payruns` body:
```json
{
  "salaryStructure": "<id>",
  "periodStart": "2026-02-01",
  "periodEnd": "2026-02-28",
  "selectedEmployees": ["<employeeId>", "<employeeId>"]
}
```

## 14. Payslips

```
GET /api/payslips?payrun=&employee=&status=   (HR Payroll User+; Employee restricted to own + status=Paid only)
GET /api/payslips/:id                          (same rule)
GET /api/payslips/:id/pdf                      (same rule) — streams a PDF (Content-Type: application/pdf)
PUT /api/payslips/:id                          (HR Payroll User, HR Payroll Manager, Admin) — manual line adjustment before validation
DELETE /api/payslips/:id                       (HR Payroll Manager, Admin) — only while Payrun status is 'Draft'
```

## 15. Dashboard

```
GET /api/dashboard?period=&department=&employeeType=&scope=full|hr
```
Roles: `HR Manager` (must pass `scope=hr`, receives HR-only sections), `HR Payroll User, HR Payroll Manager, Admin` (full).

Response shape:
```json
{
  "success": true,
  "data": {
    "kpis": {
      "totalNetSalaryPaid": 0,
      "payslipsGenerated": 0,
      "averageSalary": 0,
      "approvedTimeOffDays": 0,
      "attendanceHealthPercent": 0
    },
    "charts": {
      "salaryCostByDepartment": [{ "department": "Engineering", "amount": 0 }],
      "monthlyNetSalaryTrend": [{ "month": "2026-01", "amount": 0 }]
    },
    "alerts": [{ "type": "missing_bank_details", "count": 0 }, { "type": "duplicate_payslip", "count": 0 }],
    "attendanceOverview": { "present": 0, "late": 0, "absent": 0, "overtime": 0, "missingCheckouts": 0, "manualEdits": 0, "coveragePercent": 0 },
    "timeOffOverview": { "approvedDays": 0, "pendingRequests": 0 },
    "departmentBreakdown": [{ "department": "Engineering", "headcount": 0, "totalSalary": 0 }]
  }
}
```
Full detail on the aggregation queries backing this is in `19-PAYROLL-DASHBOARD-AND-REPORTING.md`.

## 16. Standard Error Responses

| Status | Meaning |
|---|---|
| 400 | Validation error (`errors: [{ field, message }]`) |
| 401 | Not authenticated (no/invalid session) |
| 403 | Authenticated but role not authorized |
| 404 | Resource not found |
| 409 | Conflict (overlapping contract, duplicate payslip, insufficient leave balance) |
| 500 | Unexpected server error |
