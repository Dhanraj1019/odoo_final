# 02 — Official Workflow (Screen-by-Screen, from Provided Mockup Images)

This file documents every screen and flow shown in the official hackathon workflow image (`HRMS_OXP_-_24_hours.png`). It complements `01-HACKATHON-REQUIREMENTS.md` with the concrete UI/flow detail needed to build matching screens.

## 0) Login & User Access Flow

- **HR Portal login screen**: email + password + "Sign in" button + "Forgot password?" link. Note: *"Accounts are created by an administrator."*
- **User Management screen** (Admin-only): search users, filters, table (Employee, Email, Role, Status), "Create User" action, "Open as User" action.
- **Create/Edit User form**: Full Name, Email, Password, Role(s) checklist — Employee, HR Manager, HR Payroll User, HR Payroll Manager, Admin — "Create User / Save Changes" button.
- **Explicit note from the mockup**:
  - In the ERP flow, user accounts are created by an Admin.
  - When creating a user, link the account to the relevant employee and assign one or more roles.
  - Roles control which records and actions become available after login.
  - Users are not able to assign or elevate their own roles.
  - Password reset, invitations, SSO, etc. are open to interpretation (**mark as Assumption where implemented**).

**Confirmed decision:** no public signup — see `09-AUTHENTICATION-AND-USER-MANAGEMENT.md`.

## 1) Employee & Contract Flow

**Employee menu bar** (used consistently across all HR screens): `Employees ▾ | Contracts ▾ | Attendance ▾ | Time Off ▾ | Payroll ▾`

- **Employees List/Kanban view**: search/filter bar, employee cards or rows (Avatar, Name, Job Position/Department, Status badge). Row click opens the Employee Form.
- **Employee Form**: profile header (avatar, name, job title), tabs/sections for Department, Manager, Job Position, Work Location, Schedule, Status. Smart-button-style links/tabs to: Contracts, Attendance, Time Off, Allocations.
- **Contracts List**: table with Employee, Start Date, End Date, Wage/Month, Status — active contract clearly highlighted (e.g., colored badge).
- **Contract Form** (e.g., "Contract / COM/2026/0042"): Employee, Department, Job Position, Start Date, End Date, Wage/Month, Salary Structure, Status.
  - Note: only the active/period-applicable contract should be used by payroll for that period.

**Working Schedule — List & Form Views**
- List: Schedule Name, Days/Week, Hours/Week (auto-computed), Company, Status.
- Form: weekly grid — Day, Start Time, End Time, Break, with a computed **Total Weekly Hours** field.
- Note from mockup: *"A schedule should capture the weekly working pattern (days, working hours) and total weekly hours should be derived from the schedule. A schedule can be assigned to an Employee/Contract and used by Attendance and Payroll. Shift, flexible-time and other rules are open to interpretation."* (→ **Assumption boundary**: only fixed weekly-pattern schedules are required; shift/flex patterns are optional stretch scope.)

## 2) Attendance Flow

- **Attendance List**: filter by employee, table of Employee, Check In, Check Out, Worked Hours, Status.
- **Attendance Form** (e.g., "Attendance / Aarav Mehta / 02-Sep-2026"): Employee, Date, Check In, Check Out, Worked Hours (computed), Status, notes/correction field.
- **Attendance Widget** (self-service check-in/out): shows current time, "Check In"/"Check Out" button toggling state, today's summary.
  - Note: *"Clicking the attendance icon opens the Check In / Check Out popup."*
- **Mockup notes**:
  - Attendance accessible globally or from an individual employee (filtered to that employee only).
  - Store check-in, check-out, worked hours, and attendance status.
  - Data must be usable later for reporting/dashboard insights.
  - If the user is already checked in, show "Check Out"; the popup should display elapsed time and clock in/out timestamps.

## 3) Time Off Flow

**Time Off menu**: `Dashboard | Time off | Time off Types | Allocations` (under the Time Off module)

- **Time Off Requests List**: Employee, Type, Dates, Duration, Status (Approved/Refused/Submitted badges), quick Approve/Refuse actions.
- **Time Off Request Form**: Employee, Type, Start/End Date, Duration, Status, Approve/Refuse buttons (restricted to HR Manager+ roles).
- **Allocations List**: Employee, Time Off Type, Allocated, Taken, Remaining, Validity dates, Status.
- **Allocation Form**: Employee, Time Off Type, Allocated amount, Validity period, Status (requires approval before it becomes usable).
- **Time Off Types List/Form**: Name, Unit (Days/Hours), Requires Allocation (yes/no), Requires Approval (yes/no), Payroll Integration (affects payslip yes/no).
- **Mockup notes**:
  - Requests support a simple approval flow.
  - For leave types requiring allocation, approved leave reduces the employee's available balance.
  - Time Off Types define how each leave type behaves; exact policies are open to interpretation (**Assumption boundary**).

## 4) Payroll — Payrun & Payslips

**Payroll menu**: `Dashboard | Payruns | Payslips | Structures | Rules`

- **New Pay Run wizard (Step 1)**: Pay Structure (dropdown), Period (date range) — "Continue" button. *Note: this only sets Payrun scope; Continue does not create the record yet.*
- **Select Employee Records (Step 2)**: table of eligible employees (Employee, Working Hours, Start Date, Wage) with checkboxes, "Create Payrun" button, "Back" button.
  - Note: *"The Payrun is created only after employee selection."*
- **Payruns List**: grouped/listed by month (e.g., "January 2026 — 40 employees — Draft"), status badges (Draft/Computed/Validated/Paid).
- **Payrun Form** (e.g., "Payrun / February 2026"): action buttons — Compute, Validate, Mark Paid, Send Payslips — plus run name, structure, period, status, and the list of payslips in this run.
- **Payslips List**: filter by run, table of Employee, Status, Net Pay, etc., "Open Payslip" action.
- **Payslip Form** (e.g., "Payslip / Aarav Mehta / February 2026"): header identification (Employee, Structure, Pay Run, Period, Status, Worked Days), a **Salary Computation** table (rule Name, Category, Amount) building Basic → Allowances → Gross → Deductions → Net, "Print Payslip" action.
- **Payroll creation notes (verbatim from mockup)**:
  - Creating a Payrun happens in two steps: select scope (employee type, salary structure, period), then select employees to include.
  - Continue only moves to employee selection; a Payrun is created only after clicking "Create Payrun." Only the selected employees are included.
  - A Payrun represents payroll processing for a particular period.
  - Each selected employee gets a Payslip linked to the Payrun.
  - Computing payroll uses the employee's applicable contract and the selected salary structure.
  - Payslips show understandable components: Basic, Allowances, Deductions, Gross, Net Salary.
  - Payroll issues (missing required info, duplicate payslips) must be visible to the user.
  - Intended workflow: **Draft → Compute → Validate → Mark Paid**. Paid/finalized payroll remains as historical data.

## 5) Payroll Configuration — Salary Structures & Rules

- **Salary Structures List**: Name, # Rules, # Employees using it, Active status.
- **Salary Structure Form** (e.g., "Salary Structure / Regular Salary"): ordered list of included Salary Rules (drag/sequence), name, description, active toggle.
- **Salary Rules List**: Name, Code, Category, Sequence, Active.
- **Salary Rule Form** (e.g., "Salary Rule / Basic Salary"): Name, Code, Category (Basic/Allowance/Gross/Deduction/Net), Sequence, Computation Method (Fixed Amount / Percentage / Formula/Code), condition/active toggle.
- **Computation Method notes (verbatim from mockup)**:
  - **Fixed Amount** — uses the exact value entered in the rule (e.g., Meal Allowance = 2,000).
  - **Percentage** — calculates the rule as a percentage of a selected base, such as Contract Wage, Basic Salary, or Gross Salary (e.g., HRA = 20% × Basic Salary).
  - **Python Code / Formula** — used for advanced calculations where fixed or percentage methods are not sufficient, such as attendance-based earnings, overtime, unpaid leave deductions, or calculations using multiple salary rules.
  - → **Recommended Implementation Decision**: since the backend is Node.js (not Python), this is implemented as a **safe expression engine** (see `16-PAYROLL-FORMULA-ENGINE.md`) that preserves the same business capability without executing arbitrary code.

## 6) Payroll Dashboard

- **Filter bar**: Period (e.g., "Sep 2026"), Department (dropdown), Employee Type (dropdown), Company.
- **KPI Cards**: Total Net Salary Paid, Payslips Generated, Avg. Salary/Employee, Approved Time Off Days, Attendance Health (%).
- **Charts**:
  - Salary Cost by Department (bar chart).
  - Monthly Net Salary Trend (line chart).
  - Payslip Status & Payroll alerts (donut/status breakdown: Paid/Pending/Draft + alert list e.g. "3 employees missing bank details", "1 duplicate payslip pending").
- **Attendance Overview**: Present/Late/Absent/Overtime counts, missing check-outs, manual edits, attendance coverage %.
- **Time Off Overview**: Approved/Pending requests, Taken vs Remaining balances.
- **Department Overview**: headcount + total salary per department.
- **Note (verbatim)**: *"The dashboard should use actual data created through the HR and Payroll flows rather than hardcoded values."* Filters (Period, Department, Employee Type, Company) must affect all dashboard sections shown.

## 7) Consistent UI Elements Across the Mockup

- Persistent module-based **top navigation** (not a permanent sidebar).
- Search + Filter bar pattern at the top of every list view.
- Status badges (colored) used consistently: Draft, Computed, Validated, Paid, Approved, Refused, Submitted, Active, Ended.
- Smart-link/tab pattern from parent record (Employee) to child records (Contracts/Attendance/Time Off/Allocations).
- Dark theme is used in the raw mockup only as a wireframe style — **per Final Decision 2, the actual product UI uses a modern, professional light ERP theme**, not the mockup's dark/terminal aesthetic. The mockup's *structure and layout* is the source of truth; its *color theme* is not.
