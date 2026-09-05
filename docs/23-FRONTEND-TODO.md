# 23 — Frontend TODO

Do not start Phase 14 until Backend Phase 13 (`22-BACKEND-TODO.md`) is complete. Tasks are small, sequential, testable.

## Phase 14 — Frontend Foundation

- [ ] Confirm repo folder is `frontend/` (not `frontand/`); fix any remaining path references (imports, configs, scripts)
- [ ] Verify Vite config, dev server proxy (or `VITE_API_BASE_URL`) pointing at the backend
- [ ] Install new dependency: `npm install recharts`
- [ ] Set up `src/app/store.js` (Redux Toolkit store) preserving existing `auth`/`notifications` slices
- [ ] Set up `src/lib/apiClient.js` fetch wrapper per `20-FRONTEND-ARCHITECTURE.md` §7
- [ ] Set up Tailwind v4 config, remove old cyberpunk/terminal theme classes and custom CSS
- [ ] Build base layout shell: `AppLayout` (top header, empty nav placeholder), `AuthLayout`
- [ ] Set up `router.jsx` with placeholder routes for every page listed in `20-FRONTEND-ARCHITECTURE.md` §3 (empty stub components acceptable at this stage)
- [ ] Test: app boots, shows a blank professional-looking shell with no console errors

## Phase 15 — Authentication UI

- [ ] Build `LoginForm` (React Hook Form) — email, password, submit → `POST /api/auth/login`
- [ ] Wire `authSlice` to store the logged-in user and loading/error state
- [ ] Implement `RequireAuth` and `RequireRole` route guards per `20-FRONTEND-ARCHITECTURE.md` §4
- [ ] On app load, call `GET /api/auth/me` to restore session state before rendering protected routes
- [ ] Build logout action (button in header user menu) calling `POST /api/auth/logout` and redirecting to `/login`
- [ ] Confirm there is **no** signup link/page/route anywhere in the app
- [ ] Test: log in as each of the 5 seeded demo users, confirm correct redirect and correct nav items shown per role

## Phase 16 — Top Navigation & Role-Based Layout

- [ ] Build `TopNav` component with module dropdowns per `21-UI-UX-GUIDELINES.md` §2
- [ ] Wire nav item visibility to `user.roles` (`NAV_PERMISSIONS` map in `lib/constants.js`)
- [ ] Build responsive collapse (hamburger/drawer) for narrow viewports
- [ ] Build `AppHeader` user menu (name, roles badge, Logout)
- [ ] Test: resize browser to confirm nav collapses correctly; confirm nav items differ correctly across the 5 roles

## Phase 17 — Employee Management UI

- [ ] Build shared `DataTable` and `StatusBadge` components (used by every subsequent module)
- [ ] Build `EmployeeListTable` + Kanban toggle view
- [ ] Build `EmployeeForm` (create/edit)
- [ ] Build `EmployeeProfileHeader` + `RelatedRecordsTabs` (Contracts/Attendance/Time Off/Allocations counts+links)
- [ ] Build `EmployeeSelfProfile` (the Employee role's own landing page)
- [ ] Test: HR role can create/edit an employee end-to-end; Employee role sees only their own profile

## Phase 18 — Working Schedules & Contracts UI

- [ ] Build `WorkingScheduleListTable` + `WorkingScheduleForm` (weekly grid, live-computed hours preview)
- [ ] Build `ContractListTable` (active-contract highlight) + `ContractForm`
- [ ] Wire Employee Form's "Contracts" tab to the filtered Contracts list
- [ ] Test: create a schedule, assign it to an employee; create a contract, confirm overlap validation error surfaces cleanly in the form

## Phase 19 — Attendance UI

- [ ] Build `AttendanceWidget` (self-service check-in/out) on the Employee self-profile page
- [ ] Build `AttendanceListTable` (global + employee-filtered variants)
- [ ] Build `AttendanceForm` for HR manual entries/corrections
- [ ] Test: check in/out as an Employee, confirm the widget reflects state correctly; HR role opens attendance filtered from an Employee's profile

## Phase 20 — Time Off UI

- [ ] Build `TimeOffTypeListTable` + `TimeOffTypeForm`
- [ ] Build `AllocationListTable` + `AllocationForm` + approve action
- [ ] Build `TimeOffRequestListTable` (with inline Approve/Refuse) + `TimeOffRequestForm`
- [ ] Build `LeaveBalanceCard` for the Employee self-profile page
- [ ] Test: submit a request as Employee, approve as HR Manager, confirm balance updates on both views

## Phase 21 — Payroll Configuration UI

- [ ] Build `SalaryRuleListTable` + `SalaryRuleForm` (computation-method-conditional fields: Fixed/Percentage/Formula)
- [ ] Build `SalaryStructureListTable` + `SalaryStructureForm` (ordered rule picker/sequencer)
- [ ] Enforce read-only mode in the UI for `HR Payroll User` (hide/disable write actions, though backend already blocks it)
- [ ] Test: build a full structure with 5 rules including one Formula rule referencing an earlier rule's code; confirm sequence-order UI prevents referencing a later rule

## Phase 22 — Payrun & Payslip UI

- [ ] Build the 2-step Payrun creation wizard (`PayrunWizardStep1Scope`, `PayrunWizardStep2SelectEmployees`) per `21-UI-UX-GUIDELINES.md` §4
- [ ] Build `PayrunListTable` (grouped/status-badged)
- [ ] Build `PayrunProcessingScreen` with Compute/Validate/Mark Paid/Send Payslips action buttons and warnings display
- [ ] Build `PayslipListTable` + `PayslipDetailView` (rule-by-rule breakdown table)
- [ ] Build "Print Payslip" action (opens/downloads the PDF endpoint)
- [ ] Build Employee's own read-only Payslip view (Paid only)
- [ ] Test: run the full wizard end-to-end, compute, review warnings, validate, mark paid, print a PDF, send payslips (sandbox SMTP) and see per-employee results

## Phase 23 — Dashboard UI

- [ ] Build `DashboardFilterBar`
- [ ] Build `KpiCard` grid
- [ ] Build `SalaryCostByDepartmentChart` and `MonthlyNetSalaryTrendChart` (Recharts)
- [ ] Build `PayrollAlertsList`, `AttendanceOverviewPanel`, `TimeOffOverviewPanel`, `DepartmentBreakdownTable`
- [ ] Wire role-scoped rendering (`scope=hr` vs `scope=full`) per `19-PAYROLL-DASHBOARD-AND-REPORTING.md` §9
- [ ] Test: confirm dashboard numbers match seed data expectations and update correctly when filters change

## Phase 24 — Admin User Management UI

- [ ] Build `UserListTable` (search/filter)
- [ ] Build `UserForm` (multi-role checklist, employee-link selector)
- [ ] Build password-reset action
- [ ] Test: Admin creates one user per role, confirms each can log in with assigned access

## Phase 25 — Integration Polish

- [ ] Full click-through of both official demo scenarios (employee-to-payslip, leave allocation-to-request) as described in `01-HACKATHON-REQUIREMENTS.md` §9, fix any rough edges found
- [ ] Confirm no leftover cyberpunk/terminal styling anywhere
- [ ] Confirm responsive collapse works on a narrow viewport for every major screen
- [ ] Final review against `24-TESTING-PLAN.md`
