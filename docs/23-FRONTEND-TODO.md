# 23 — Frontend TODO

Do not start Phase 14 until Backend Phase 13 (`22-BACKEND-TODO.md`) is complete. Tasks are small, sequential, testable.

## Phase 14 — Frontend Foundation

- [x] Confirm repo folder is `frontend/` (not `frontand/`); fix any remaining path references (imports, configs, scripts)
- [x] Verify Vite config, dev server proxy (or `VITE_API_BASE_URL`) pointing at the backend
- [x] Install new dependency: `npm install recharts`
- [x] Set up `src/app/store.js` (Redux Toolkit store) preserving existing `auth`/`notifications` slices
- [x] Set up `src/lib/apiClient.js` fetch wrapper per `20-FRONTEND-ARCHITECTURE.md` §7
- [x] Set up Tailwind v4 config, remove old cyberpunk/terminal theme classes and custom CSS
- [x] Build base layout shell: `AppLayout` (top header, empty nav placeholder), `AuthLayout`
- [x] Set up `router.jsx` with placeholder routes for every page listed in `20-FRONTEND-ARCHITECTURE.md` §3 (empty stub components acceptable at this stage)
- [x] Test: app boots, shows a blank professional-looking shell with no console errors

## Phase 15 — Authentication UI

- [x] Build `LoginForm` (React Hook Form) — email, password, submit → `POST /api/auth/login`
- [x] Wire `authSlice` to store the logged-in user and loading/error state
- [x] Implement `RequireAuth` and `RequireRole` route guards per `20-FRONTEND-ARCHITECTURE.md` §4
- [x] On app load, call `GET /api/auth/me` to restore session state before rendering protected routes
- [x] Build logout action (button in header user menu) calling `POST /api/auth/logout` and redirecting to `/login`
- [x] Confirm there is **no** signup link/page/route anywhere in the app
- [x] Test: log in as each of the 5 seeded demo users, confirm correct redirect and correct nav items shown per role

## Phase 16 — Top Navigation & Role-Based Layout

- [x] Build `TopNav` component with module dropdowns per `21-UI-UX-GUIDELINES.md` §2
- [x] Wire nav item visibility to `user.roles` (`NAV_PERMISSIONS` map in `lib/constants.js`)
- [x] Build responsive collapse (hamburger/drawer) for narrow viewports
- [x] Build `AppHeader` user menu (name, roles badge, Logout)
- [x] Test: resize browser to confirm nav collapses correctly; confirm nav items differ correctly across the 5 roles

## Phase 17 — Employee Management UI

- [x] Build shared `DataTable` and `StatusBadge` components (used by every subsequent module)
- [x] Build `EmployeeListTable` + Kanban toggle view
- [x] Build `EmployeeForm` (create/edit)
- [x] Build `EmployeeProfileHeader` + `RelatedRecordsTabs` (Contracts/Attendance/Time Off/Allocations counts+links)
- [x] Build `EmployeeSelfProfile` (the Employee role's own landing page)
- [x] Test: HR role can create/edit an employee end-to-end; Employee role sees only their own profile

## Phase 18 — Working Schedules & Contracts UI

- [x] Build `WorkingScheduleListTable` + `WorkingScheduleForm` (weekly grid, live-computed hours preview)
- [x] Build `ContractListTable` (active-contract highlight) + `ContractForm`
- [x] Wire Employee Form's "Contracts" tab to the filtered Contracts list
- [x] Test: create a schedule, assign it to an employee; create a contract, confirm overlap validation error surfaces cleanly in the form

## Phase 19 — Attendance UI

- [x] Build `AttendanceWidget` (self-service check-in/out) on the Employee self-profile page
- [x] Build `AttendanceListTable` (global + employee-filtered variants)
- [x] Build `AttendanceForm` for HR manual entries/corrections
- [x] Test: check in/out as an Employee, confirm the widget reflects state correctly; HR role opens attendance filtered from an Employee's profile

## Phase 20 — Time Off UI

- [x] Build `TimeOffTypeListTable` + `TimeOffTypeForm`
- [x] Build `AllocationListTable` + `AllocationForm` + approve action
- [x] Build `TimeOffRequestListTable` (with inline Approve/Refuse) + `TimeOffRequestForm`
- [x] Build `LeaveBalanceCard` for the Employee self-profile page
- [x] Test: submit a request as Employee, approve as HR Manager, confirm balance updates on both views

## Phase 21 — Payroll Configuration UI

- [x] Build `SalaryRuleListTable` + `SalaryRuleForm` (computation-method-conditional fields: Fixed/Percentage/Formula)
- [x] Build `SalaryStructureListTable` + `SalaryStructureForm` (ordered rule picker/sequencer)
- [x] Enforce read-only mode in the UI for `HR Payroll User` (hide/disable write actions, though backend already blocks it)
- [x] Test: build a full structure with 5 rules including one Formula rule referencing an earlier rule's code; confirm sequence-order UI prevents referencing a later rule

## Phase 22 — Payrun & Payslip UI

- [x] Build the 2-step Payrun creation wizard (`PayrunWizardStep1Scope`, `PayrunWizardStep2SelectEmployees`) per `21-UI-UX-GUIDELINES.md` §4
- [x] Build `PayrunListTable` (grouped/status-badged)
- [x] Build `PayrunProcessingScreen` with Compute/Validate/Mark Paid/Send Payslips action buttons and warnings display
- [x] Build `PayslipListTable` + `PayslipDetailView` (rule-by-rule breakdown table)
- [x] Build "Print Payslip" action (opens/downloads the PDF endpoint)
- [x] Build Employee's own read-only Payslip view (Paid only)
- [x] Test: run the full wizard end-to-end, compute, review warnings, validate, mark paid, print a PDF, send payslips (sandbox SMTP) and see per-employee results

## Phase 23 — Dashboard UI

- [x] Build `DashboardFilterBar`
- [x] Build `KpiCard` grid
- [x] Build `SalaryCostByDepartmentChart` and `MonthlyNetSalaryTrendChart` (Recharts)
- [x] Build `PayrollAlertsList`, `AttendanceOverviewPanel`, `TimeOffOverviewPanel`, `DepartmentBreakdownTable`
- [x] Wire role-scoped rendering (`scope=hr` vs `scope=full`) per `19-PAYROLL-DASHBOARD-AND-REPORTING.md` §9
- [x] Test: confirm dashboard numbers match seed data expectations and update correctly when filters change

## Phase 24 — Admin User Management UI

- [x] Build `UserListTable` (search/filter)
- [x] Build `UserForm` (multi-role checklist, employee-link selector)
- [x] Build password-reset action
- [x] Test: Admin creates one user per role, confirms each can log in with assigned access

## Phase 25 — Integration Polish

- [x] Full click-through of both official demo scenarios (employee-to-payslip, leave allocation-to-request) as described in `01-HACKATHON-REQUIREMENTS.md` §9, fix any rough edges found
- [x] Confirm no leftover cyberpunk/terminal styling anywhere
- [x] Confirm responsive collapse works on a narrow viewport for every major screen
- [x] Final review against `24-TESTING-PLAN.md`
