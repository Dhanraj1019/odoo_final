# 10 — Employee Management

## 1. Purpose

The Employee record is the **central hub** of the entire system. Every other module (Contracts, Attendance, Time Off, Payslips) references an `Employee._id`.

## 2. Views Required (per official workflow)

1. **Kanban view** — cards grouped (e.g., by department or status), showing avatar, name, job position, status badge.
2. **List view** — sortable/filterable table: Name, Department, Job Position, Manager, Status.
3. **Employee Form** — the operational hub:
   - Header: avatar, full name, job title, status badge.
   - Fields: Department, Manager, Job Position, Working Schedule, Employee Type, Date of Joining, Contact info.
   - Related-record links/tabs (smart-buttons): **Contracts**, **Attendance**, **Time Off**, **Allocations** — each opens a view filtered to this employee, with a count badge.

## 3. Data Source

See `06-DATABASE-DESIGN.md` §5 for the full `Employee` schema.

## 4. Business Rules

- `employeeCode` and `email` are unique — enforced at schema level with a friendly `409` error surfaced by the controller if a duplicate is attempted.
- `manager` must reference another `Employee` (not itself) — validated in `employee.service.js`.
- Deactivating an employee (`status: 'Terminated'`) is a **soft delete**: the record remains for historical Contract/Attendance/Payslip integrity. Hard delete is not exposed in the UI.
- `workingSchedule` set here is the **default** schedule; a `Contract.workingSchedule`, if present, overrides it for the contract's duration (see `12-WORKING-SCHEDULE.md`).

## 5. Role Behavior

| Role | Behavior |
|---|---|
| Employee | Sees only their own record via `GET /api/employees/me`; read-only. Cannot browse the full Employee list/kanban. |
| HR Manager, HR Payroll User, HR Payroll Manager, Admin | Full CRUD, full list/kanban access, can open any employee's related records. |

## 6. Related-Record Navigation Pattern (Applies Across the App)

Each smart-button on the Employee Form links to a pre-filtered list:
- **Contracts** → `/contracts?employee=<id>`
- **Attendance** → `/attendance?employee=<id>`
- **Time Off** → `/time-off/requests?employee=<id>`
- **Allocations** → `/time-off/allocations?employee=<id>`

Implement this as a single reusable frontend pattern (a `RelatedRecordsTabs` component reading a query param) rather than bespoke code per module — see `20-FRONTEND-ARCHITECTURE.md`.

## 7. Frontend Components Needed

- `EmployeeKanbanBoard`
- `EmployeeListTable`
- `EmployeeForm` (create/edit, React Hook Form)
- `EmployeeProfileHeader` (avatar, name, status badge, smart-button tab bar)
- `EmployeeSelfProfile` (simplified read-only view for the `Employee` role's own landing page)

## 8. Assumptions

- Avatars: no upload/storage system is specified. **Assumption:** use initials-based avatar generation (no file upload pipeline needed) — avoids introducing file storage infrastructure not required by the spec.
- Kanban grouping: **Assumption** — group by Department by default, with a toggle to group by Status.
