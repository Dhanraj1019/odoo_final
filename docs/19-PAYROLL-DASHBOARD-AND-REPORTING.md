# 19 — Payroll Dashboard & Reporting

## 1. Purpose

A single aggregation endpoint (`GET /api/dashboard`, see `08-API-CONTRACTS.md` §15) that reflects **live data only** — never hardcoded/static values, per the explicit official requirement.

## 2. Filters

`period` (month or date-range), `department`, `employeeType`, and a `scope` flag (`hr` vs `full`) that determines which sections a caller receives, per `05-RBAC-ROLES-PERMISSIONS.md` §3/§4.

## 3. KPI Cards — Aggregation Logic

| KPI | Source Query |
|---|---|
| Total Net Salary Paid | `Payslip.aggregate([{ $match: { status: 'Paid', periodStart: {...filters} } }, { $group: { _id: null, total: { $sum: "$netSalary" } } }])` |
| Payslips Generated | `Payslip.countDocuments({ periodStart: {...filters} })` |
| Average Salary | `total net salary / payslip count` for the filtered set |
| Approved Time Off (days) | `TimeOffRequest.aggregate` summing `duration` where `status: 'Approved'` and dates fall in period |
| Attendance Health % | `(Present + Late count) / total expected working-day records` for the period, from `Attendance` |

## 4. Charts

### Salary Cost by Department
```js
Payslip.aggregate([
  { $match: { status: "Paid", periodStart: { $gte: from, $lte: to } } },
  { $lookup: { from: "employees", localField: "employee", foreignField: "_id", as: "emp" } },
  { $unwind: "$emp" },
  { $group: { _id: "$emp.department", amount: { $sum: "$netSalary" } } },
  { $lookup: { from: "departments", localField: "_id", foreignField: "_id", as: "dept" } },
  { $unwind: "$dept" },
  { $project: { department: "$dept.name", amount: 1, _id: 0 } }
]);
```

### Monthly Net Salary Trend
```js
Payslip.aggregate([
  { $match: { status: "Paid" } },
  { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$periodStart" } }, amount: { $sum: "$netSalary" } } },
  { $sort: { _id: 1 } },
  { $project: { month: "$_id", amount: 1, _id: 0 } }
]);
```
Limit to the last 12 months by default (Recommended Implementation Decision, for a readable chart).

## 5. Operational Alerts

Computed by scanning the most recent relevant Payrun(s)/Payslip(s) for the selected period:

| Alert type | Condition |
|---|---|
| `missing_bank_details` | Count of Payslips in scope whose employee has no `bankDetails.accountNumber` |
| `duplicate_payslip` | Count of Payslips flagged with a "Duplicate payslip" warning |
| `no_active_contract` | Count of Payslips flagged with a "No active contract" warning |
| `pending_payruns` | Count of Payruns with `status` in `['Draft', 'Computed']` (not yet finalized) |

## 6. Attendance Overview

```js
Attendance.aggregate([
  { $match: { date: { $gte: from, $lte: to } } },
  { $group: { _id: "$status", count: { $sum: 1 } } }
]);
```
Plus: `missingCheckouts` = count where `checkIn` set, `checkOut` null, `date < today`; `manualEdits` = count where `isManualCorrection: true`; `coveragePercent` = `(records with any status other than Absent) / total expected records` for the period.

## 7. Time Off Overview

`approvedDays` = sum of `duration` for `status: 'Approved'` requests in period. `pendingRequests` = count of `status: 'Submitted'` requests (all-time or scoped to period, whichever reads more usefully — Recommended: all currently pending, regardless of period filter, since "pending" is inherently a current-state metric, not a historical one).

## 8. Department Breakdown

```js
Employee.aggregate([
  { $match: { status: "Active" } },
  { $group: { _id: "$department", headcount: { $sum: 1 } } },
  { $lookup: { from: "departments", localField: "_id", foreignField: "_id", as: "dept" } },
  { $unwind: "$dept" }
]);
// then join headcount with the Salary Cost by Department result (§4) by department name/id
```

## 9. Role-Scoped Sections (per `05-RBAC-ROLES-PERMISSIONS.md`)

| Section | HR Manager (`scope=hr`) | HR Payroll User/Manager, Admin (`scope=full`) |
|---|---|---|
| KPIs: salary-related | Hidden | Shown |
| KPIs: Approved Time Off, Attendance Health | Shown | Shown |
| Charts: Salary Cost, Net Salary Trend | Hidden | Shown |
| Alerts | Payroll-specific alerts hidden; contract/HR alerts shown | All shown |
| Attendance/Time Off Overview | Shown | Shown |
| Department Breakdown | Headcount only (no `totalSalary`) | Full (headcount + salary) |

The backend must implement this as a genuine data-shaping decision in `dashboard.service.js` (omit fields from the response), not just a frontend hide — since backend guards are the real security boundary (§5 of `05-RBAC-ROLES-PERMISSIONS.md`).

## 10. Frontend Components

- `DashboardFilterBar` (Period, Department, Employee Type selectors)
- `KpiCard` (reusable)
- `SalaryCostByDepartmentChart` (Recharts `BarChart`)
- `MonthlyNetSalaryTrendChart` (Recharts `LineChart`)
- `PayrollAlertsList`
- `AttendanceOverviewPanel`
- `TimeOffOverviewPanel`
- `DepartmentBreakdownTable`

## 11. Performance Note

For hackathon data volumes (tens to low hundreds of employees/payslips), running these aggregations on every dashboard request is fine — no caching layer is required. Do not introduce Redis or a pre-computed reporting table; that would be over-engineering for this scope.
