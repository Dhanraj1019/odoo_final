# 01 — Hackathon Requirements (Official Source of Truth)

This file restates the official Hackathon Problem Statement in structured form. **This is the primary source of truth.** Any other documentation file that conflicts with this one is wrong and must be corrected.

## 1. Project Title

**PeoplePay360: HR & Payroll — An Integrated Human Resource and Payroll Operations Platform.**

## 2. Problem Being Solved

Most basic HR tools store employee details, attendance, leave, and salary data as **separate, disconnected records**. Real HR/payroll teams need these to work together:

- An employee may have multiple contracts over time; payroll must use the one applicable to the current period.
- Working hours come from an assigned schedule.
- Attendance contains exceptions that may need review.
- Leave balances depend on allocations and approved requests.
- Payroll must transform all of the above into understandable payslips before payment.

The Employee record is the **central hub**; Contracts and Working Schedules provide payroll context; Attendance and Time Off capture day-to-day activity; Salary Structures/Rules define computation; Payruns turn eligible records into validated, printable, emailable Payslips.

Teams may use any language/framework/database — the **focus is on business logic, data relationships, payroll computation flow, and end-to-end UX**, not platform choice.

## 3. Goals & Scope

**Main Goal:** an integrated HR and payroll platform managing the full employee lifecycle — master data, time tracking, payroll calculation, reporting.

**Key Outcomes:**
- Unified HR flow — centralized employee records, seamless navigation to Contracts/Attendance/Time Off.
- Contract management — historical records preserved; payroll uses only the active, period-specific contract.
- Operational tracking — flexible Working Schedules, attendance (with exception handling), full Time Off (requests/allocations).
- Payroll processing — two-step Payrun workflow (scope/period → employee selection); payslips with clear breakdowns (Basic, Allowances, Deductions) and validation warnings.
- Reporting — centralized Payroll Dashboard aggregating HR/Payroll data across Periods, Departments, Employee types.

## 4. User Roles (Verbatim Requirements)

### Employee
- View own employee details, attendance records, and leave balances.
- Create attendance entries and Time Off Requests.
- No payroll or HR administration access.

### HR Manager
- Full CRUD on Employees, Attendance, Contracts, Working Schedules, Time Off.
- Approve or refuse Time Off Requests.
- No access to payroll features.

### HR Payroll User
- All HR Manager permissions.
- Create, Read, Update access to Payruns and Payslips (no Delete stated → treated as an Assumption of "no delete" in `05-RBAC-ROLES-PERMISSIONS.md`).
- Read-only access to Salary Structures and Salary Rules.

### HR Payroll Manager
- All HR Payroll User permissions.
- Full CRUD on Payruns, Payslips, Salary Structures, Salary Rules.
- Full control over HR and payroll-related records/configurations.

### Admin
- Full access to all modules and models.
- User management, role assignment, permission updates, complete system administration.

## 5. Modules / Features Breakdown

### A) HR Backend (Configuration & Master Data)

**A1 — Employee Master Management**
- Kanban, List, and Form views.
- Employee form captures: department, manager, schedule, job position, status.
- List view + direct links from Employee form to filter related Contracts, Attendance, Time Off.

**A2 — Contract Management**
- Historical contract records linked to employees.
- List view shows dates, wages, status; clearly highlights the active contract.
- Contract form captures: duration, department, position, wage, salary structure.
- Payroll processes only the contract applicable to the selected period; avoid concurrent active contracts.

**A3 — Working Schedule Setup**
- List and Form views; list shows name, type, weekly hours.
- Form defines weekly pattern via Day, Start Time, End Time, Break.
- Weekly hours are **calculated automatically** from the schedule, not entered manually.
- Schedules assigned to employees or contracts.

**A4 — Time Off Type & Allocation Setup**
- Time Off accessible via main navigation: Requests, Allocations, Time Off Types.
- Time Off Types define: units (days/hours), allocation requirement, approval workflow, payroll integration.
- Allocations manage balances, require approval before availability, track taken/remaining/validity.
- Approved leave requests auto-deduct from allocations.

**A5 — Salary Structure Setup**
- Structures act as containers for ordered Salary Rules (e.g., "Regular Salary").
- List and Form views showing rule count, employee count, active status.
- Form manages included rules and execution sequence.
- The structure selected on a Payrun dictates which rules apply.

**A6 — Salary Rule Setup**
- List/Form views manage Name, Code, Category, Sequence.
- Categories: Basic, Allowances, Gross, Deductions, Net.
- Rules processed in sequence so later rules can build on earlier results.
- Computation methods: fixed amount, percentage, or formula.

**A7 — Reporting & Dashboard Configuration**
- Payroll Dashboard integrates HR + Payroll data, showing live metrics from real records.
- Filterable by Period and Department.
- Employee Type filters restrict data to groups (e.g., full-time/contract).

### B) HR & Payroll Frontend (Operational Experience)

**B1 — Main Navigation & Employee Views**
- Top navigation exposes: Employees, Contracts, Attendance, Time Off, Payroll, Reports.
- Employees accessible via Kanban or List, both leading to a unified Employee Form (operational hub).

**B2 — Employee Form & Related Record Navigation**
- Displays identity, role, department, manager, schedule, active status.
- Smart-button actions show counts and open filtered views for Contracts, Attendance, Time Off, Allocations.

**B3 — Attendance List & Form**
- Accessible globally or from an individual Employee Form.
- List shows Check In, Check Out, Worked Hours, Status.
- Form supports manual corrections restricted to authorized users.
- Data feeds reporting/dashboard.

**B4 — Time Off Requests**
- Accessed exclusively via Time Off → Requests.
- List shows Employee, Type, Dates, Duration, Status.
- Form supports approval or refusal workflow.
- Approved requests reduce balances for allocation-requiring types.

**B5 — Payrun Creation Wizard**
- Clicking NEW launches a setup wizard (not immediate record creation).
- Step 1: scope (Salary Structure, Period).
- Continue → moves to employee selection **without creating the Payrun yet**.
- Step 2: filter eligible staff for explicit selection.
- "Create Payrun" initializes the batch with only selected employees and opens the processing view.

**B6 — Payrun Processing Screen**
- Groups generated Payslips for a specific period.
- Actions: Compute, Validate, Mark Paid, Send Payslips.
- Displays run name, structure, period, status, payslip summary list.
- Highlights warnings (missing bank details, duplicate payslips) before finalization.
- Finalized/paid batches preserved as historical records.

**B7 — Payslip & Salary Computation Screen**
- Accessible via parent Payrun or dedicated Payslips list.
- Displays: Employee, Structure, Pay Run, Period, Status, Worked Days.
- Salary Computation section: rule-by-rule breakdown (Basic, Allowances, Deductions, Gross, Net).
- Computation uses the applicable period contract + the Payrun's assigned Salary Structure.

**B8 — Payslip PDF & Employee Delivery**
- "Print Payslip" generates a printable PDF for one employee.
- Parent Payrun has a "Send Payslips" action for bulk email distribution.

**B9 — Payroll Dashboard**
- KPI cards: Total Net Salary Paid, Payslips Generated, Average Salary, Approved Time Off, Attendance Health.
- Charts: Salary Cost by Department, Monthly Net Salary Trends.
- Operational alerts: payroll statuses, missing required info, duplicate payslips, contract attention items.
- Attendance/Time Off overviews: presence, overtime, approved days, pending requests, leave balances.
- Attendance overview: Present, Late, Absent, Overtime, missing check-outs, manual edits, attendance coverage.
- Department breakdown: headcount + total salary expenditure.
- Aggregates live data across Employees, Contracts, Payroll, Attendance, Time Off.

## 6. Complete End-to-End Flow

1. Employees managed via unified Kanban/List — the central HR hub.
2. Contracts and Working Schedules link to employees; payroll uses terms/patterns valid for the current period.
3. Attendance captures daily presence and exceptions; authorized users verify/correct entries.
4. Time Off automates leave type definition → balance allocation → request processing/approval.
5. Payroll configuration: Salary Structures + sequenced Salary Rules define computation.
6. Payroll officers initiate a Payrun (define scope + period), then select specific employees before finalizing.
7. System computes Payslips using applicable contract, structure, period context.
8. Officers review computed components + system warnings before validating and marking paid.
9. Finalized Payruns archived as history; PDF generation + email distribution available.
10. Payroll Dashboard aggregates real-time data across all modules for filtered insight.

## 7. Why This Problem Matters (Official Framing)

- Integrates HR + Payroll into one cohesive end-to-end flow (employee master data → final payslip distribution).
- Prioritizes real business logic (period-based contracts, leave allocation, ordered salary calc) over surface UI.
- Encourages industry-standard architecture: RBAC, parent-child data relationships, historical tracking.
- Rewards technical versatility while keeping focus on data relationships and payroll accuracy.

## 8. Technical Guidelines (Official)

- Any backend language/frontend framework/database is allowed (**this team has chosen**: see `04-TECH-STACK.md`).
- Implement real business rules (contract selection, schedule calc, leave logic, payroll computation) in application logic, not hardcoded values.
- Salary Rules must **actively drive** Payslip generation — config screens must be functional, not static mockups.
- Surface payroll issues (duplicates, incomplete employee data) to users before finalization.
- Payroll Dashboard must reflect real-time, live data — not static charts.
- Support Payslip PDF generation and bulk email distribution directly from the Payrun workflow.

## 9. Deliverables (Official)

1. **Functional platform** — fully operational HR + payroll system with representative demo data (employees, contracts, time, salary, payroll).
2. **Live demonstration** — 5-minute walkthrough of two end-to-end scenarios (e.g., employee-to-payslip, leave allocation-to-request).
3. **Future roadmap** — brief summary of proposed enhancements the team would prioritize with more time.

## 10. Reference Mockup

Official Excalidraw mockup: `https://app.excalidraw.com/l/65VNwvy7c4X/17vHpCNFjex`
(Also captured as static workflow images — see `02-OFFICIAL-WORKFLOW.md`.)
