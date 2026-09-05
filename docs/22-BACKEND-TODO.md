# 22 — Backend TODO

Rules: tasks are small, sequential, testable, unambiguous. Do them **in order** within a phase. Do not jump ahead to a later phase until the current phase's tasks are checked off. Mark `[x]` and update `25-CURRENT-PROGRESS.md` after each meaningful chunk of work (not necessarily after every single checkbox, but never let more than a few tasks pass unrecorded).

## Phase 1 — Backend Foundation

- [x] Rename `frontand/` to `frontend/` at the repo root (git mv, verify no broken references)
- [x] Create/verify `backend/` folder structure per `07-BACKEND-ARCHITECTURE.md` §1
- [x] Create `.env.example` with all variables from `04-TECH-STACK.md` §6
- [x] Create local `.env` (gitignored) with real local values, `MONGO_URI=mongodb://127.0.0.1:27017/peoplepay360_db`
- [x] Install/verify base dependencies: express, mongoose, passport, passport-local, express-session, connect-mongo, bcryptjs, cors, dotenv, method-override
- [x] Install new dependencies: `npm install pdfkit nodemailer`
- [x] Implement `config/db.js` — `mongoose.connect(process.env.MONGO_URI)`, log success/failure
- [x] Implement `utils/apiResponse.js` — `success(res, data, status=200, message)` / `error(res, message, status, errors)`
- [x] Implement `utils/asyncHandler.js`
- [x] Implement `middleware/errorHandler.js`
- [x] Implement `app.js` skeleton with middleware order per `07-BACKEND-ARCHITECTURE.md` §3 (no routes yet, just a `/health` route returning `{ success: true }`)
- [x] Implement `server.js` — connect DB, then `app.listen(PORT)`
- [x] Test: `GET /health` returns `200 { success: true }` with server running locally

## Phase 2 — Authentication & RBAC

- [x] Create `models/User.js` per `06-DATABASE-DESIGN.md` §2 (roles enum, unique email index)
- [x] Create `config/passport.js` — LocalStrategy, serialize/deserialize (see `09-AUTHENTICATION-AND-USER-MANAGEMENT.md` §2)
- [x] Create `config/session.js` — express-session + connect-mongo config
- [x] Wire session + passport middleware into `app.js` in the correct order
- [x] Implement `middleware/requireAuth.js`
- [x] Implement `middleware/requireRole.js`
- [x] Implement `services/auth.service.js` — `login`, `getCurrentUser` helpers (thin wrappers used by controller)
- [x] Implement `controllers/auth.controller.js` — `login`, `logout`, `me`
- [x] Implement `routes/auth.routes.js` — `POST /login`, `POST /logout`, `GET /me`
- [x] Write a one-off seed script step (or manual DB insert) to create a single bootstrap Admin user (since no signup exists) — document the bootstrap credentials in `25-CURRENT-PROGRESS.md`, not committed to source
- [x] Test: login with bootstrap Admin succeeds, session cookie set, `GET /me` returns the user, `POST /logout` clears session and `GET /me` then returns 401
- [x] Implement `controllers/users.controller.js` + `routes/users.routes.js` — full Admin-only CRUD per `08-API-CONTRACTS.md` §2
- [x] Test all 5 roles: create one User per role via the Admin API, confirm each can log in, confirm `requireRole` correctly blocks a non-Admin from hitting `/api/users`
- [x] Remove or disable any pre-existing public signup route from the old codebase (see `09-AUTHENTICATION-AND-USER-MANAGEMENT.md` §1)

## Phase 3 — Employee Master Data

- [x] Create `models/Department.js`, `models/JobPosition.js`
- [x] Implement Department/JobPosition controllers + routes (simple CRUD)
- [x] Create `models/Employee.js` per `06-DATABASE-DESIGN.md` §5
- [x] Implement `services/employee.service.js` (list with filters, create, update, manager-self-reference validation)
- [x] Implement `controllers/employees.controller.js` + `routes/employees.routes.js` per `08-API-CONTRACTS.md` §3
- [x] Implement `GET /api/employees/me` resolving `req.user.employee`
- [x] Test: create employees across departments, confirm unique `employeeCode`/`email` enforcement, confirm Employee-role user only sees their own record

## Phase 4 — Working Schedules

- [x] Create `models/WorkingSchedule.js` with `pre('save')` computed-hours hook per `12-WORKING-SCHEDULE.md` §4
- [x] Implement controller + routes (`08-API-CONTRACTS.md` §6)
- [x] Link `Employee.workingSchedule` field usage (already in schema; confirm populate works)
- [x] Test: create a schedule with 5 weekday rows, confirm `totalWeeklyHours` computes correctly server-side and cannot be overridden by client input

## Phase 5 — Contracts

- [x] Create `models/Contract.js` per `06-DATABASE-DESIGN.md` §6
- [x] Implement `services/contract.service.js` — `resolveApplicableContract`, overlap-check logic per `11-CONTRACT-MANAGEMENT.md` §§4–5
- [x] Implement controller + routes per `08-API-CONTRACTS.md` §5
- [x] Test: create two contracts for one employee with overlapping Active date ranges → expect `409`; create sequential non-overlapping contracts → expect success; call `resolveApplicableContract` for a period and confirm correct contract returned

## Phase 6 — Attendance

- [x] Create `models/Attendance.js` with unique `{employee, date}` compound index
- [x] Implement `services/attendance.service.js` — check-in/check-out logic, status derivation per `13-ATTENDANCE-MANAGEMENT.md` §§4–5
- [x] Implement controller + routes per `08-API-CONTRACTS.md` §7
- [x] Test: self check-in then check-out as an Employee-role user, confirm `workedHours`/`status` computed; attempt double check-in → expect `409`; confirm HR role can manually create/correct an attendance record and `isManualCorrection`/`correctedBy` are set

## Phase 7 — Time Off

- [x] Create `models/TimeOffType.js`, `models/TimeOffAllocation.js`, `models/TimeOffRequest.js`
- [x] Implement `services/timeOff.service.js` — duration computation, allocation-deduction-on-approval logic per `14-TIME-OFF-MANAGEMENT.md` §6
- [x] Implement Time Off Type controller + routes
- [x] Implement Allocation controller + routes (including `/approve`)
- [x] Implement Request controller + routes (including `/approve`, `/refuse`)
- [x] Test: create a Type requiring allocation, create + approve an Allocation, submit a Request within balance → approve succeeds and `takenAmount` increments; submit a Request exceeding remaining balance → approve returns `409`

## Phase 8 — Salary Structures & Rules

- [x] Create `models/SalaryRule.js` per `06-DATABASE-DESIGN.md` §13
- [x] Create `models/SalaryStructure.js` per `06-DATABASE-DESIGN.md` §12
- [x] Implement Salary Rule controller + routes, with `computationMethod`-matching-field validation (§13 note)
- [x] Implement Salary Structure controller + routes, including the circular-dependency/sequence validation from `16-PAYROLL-FORMULA-ENGINE.md` §7 at structure-save time
- [x] Test: create rules of each computation method (Fixed/Percentage/Formula), assemble a structure, confirm read-only enforcement for `HR Payroll User` (403 on write attempts) and full CRUD for `HR Payroll Manager`

## Phase 9 — Formula Engine

- [x] Implement `services/formulaEngine.service.js`: `tokenize`, `parse`, `evaluate` per `16-PAYROLL-FORMULA-ENGINE.md` §§5–6
- [x] Implement formula validation at Salary Rule save time (parse-only check, §7)
- [x] Write unit tests (or a manual test script) covering: simple arithmetic, percentage-of-earlier-rule reference, `MAX`/`MIN`/`ROUND`/`ABS`/`IF`, a deliberately malformed expression (expect rejection), an expression referencing an unapproved identifier (expect rejection)
- [x] Confirm **no** code path in this service uses `eval`, `new Function`, or `child_process` (manual code review checklist item)

## Phase 10 — Payroll Processing (Payruns & Payslips)

- [x] Create `models/Payrun.js` per `06-DATABASE-DESIGN.md` §14
- [x] Create `models/Payslip.js` per `06-DATABASE-DESIGN.md` §15 (with frozen `lines[]` snapshot array)
- [x] Implement `services/payrollCompute.service.js` — implements the full compute pipeline from `15-PAYROLL-ARCHITECTURE.md` §4 (lock in selected employees, resolve applicable contract, gather attendance & leave, execute salary structure rules in array order, catch formula errors into warnings, compute totals)
- [x] Implement Payrun state machine: `Draft` → `Computed` → `Validated` → `Paid` (with transition guards from `17-APPROVAL-WORKFLOWS.md` §4)
- [x] Implement Payrun controller + routes per `08-API-CONTRACTS.md` §13 (including `/compute`, `/validate`, `/mark-paid`)
- [x] Implement Payslip controller + routes per `08-API-CONTRACTS.md` §14 (including manual line editing while Payrun is not yet validated, delete restricted to Draft)
- [x] Test: create a Payrun, compute payslips for 2+ employees (one standard, one with unpaid leave deduction, one with a contract issue generating a warning), validate the payrun, mark it paid; confirm payslips become viewable by `Employee` only after `Paid` status

## Phase 11 — Payslip PDF & Email

- [x] Implement `services/pdf.service.js` per `18-PAYSLIP-PDF-AND-EMAIL-DELIVERY.md` §3
- [x] Implement `GET /api/payslips/:id/pdf`
- [x] Implement `services/mailer.service.js` per §5 of the same doc
- [x] Implement `POST /api/payruns/:id/send-payslips` per §4
- [x] Test: download a PDF for one payslip and visually confirm line items match the computed data; send payslips for a small test Payrun using a sandbox SMTP account, confirm per-employee results array returned

## Phase 12 — Dashboard & Reporting

- [x] Implement `services/dashboard.service.js` with all aggregation pipelines from `19-PAYROLL-DASHBOARD-AND-REPORTING.md`
- [x] Implement `GET /api/dashboard` with `scope` role-based field-shaping (§9 of that doc)
- [x] Test: with seed data present, confirm KPI numbers match manual expectation for a known small dataset; confirm `scope=hr` response omits salary fields

## Phase 13 — Seed Data & Backend Hardening

- [x] Implement `utils/seed.js` per `06-DATABASE-DESIGN.md` §17 (departments, schedules, employees across roles, contracts, a full salary structure, attendance history, time off data, at least one Paid Payrun)
- [x] Run seed script against local MongoDB, verify counts in each collection
- [x] Review every route for correct `requireAuth`/`requireRole` guards against `05-RBAC-ROLES-PERMISSIONS.md` §4 (a full pass, one route at a time)
- [x] Confirm no route leaks `passwordHash` in any response
- [x] Confirm `.env` is gitignored and `.env.example` has no real secrets

**Backend is considered "done enough" to begin major frontend work only after Phase 13 is fully checked off.**
