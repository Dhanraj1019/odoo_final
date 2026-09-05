# 05 — RBAC: Roles & Permissions

## 1. Roles (Exact, Fixed Set)

```
Role = "Admin" | "HR Manager" | "HR Payroll User" | "HR Payroll Manager" | "Employee"
```

Do not add, rename, or remove roles.

## 2. Multi-Role Model (Confirmed)

A `User` document has:

```js
roles: [String]   // enum: the 5 roles above, at least one required
```

**Authorization rule:** a route/action defines an **allowed-roles list**. A user is authorized if **at least one** of their assigned roles appears in that list (role-union / OR logic).

**Effective permissions** for a multi-role user = the **union** of all permissions granted by each of their assigned roles individually. There is no permission subtraction/conflict resolution needed — permissions only ever add up, never restrict each other.

Implementation pattern (backend middleware):

```js
function requireRole(allowedRoles) {
  return (req, res, next) => {
    const userRoles = req.user?.roles || [];
    const isAuthorized = userRoles.some(r => allowedRoles.includes(r));
    if (!isAuthorized) return res.status(403).json({ success: false, message: "Forbidden" });
    next();
  };
}

// usage
router.post("/api/payruns", requireAuth, requireRole(["HR Payroll User", "HR Payroll Manager", "Admin"]), createPayrun);
```

Keep this simple. Do not build a generic permission-engine/ACL table for a hackathon project — hardcoded allowed-role arrays per route are sufficient and are the **Recommended Implementation Decision**.

## 3. Full Permission Matrix

Legend: `C` = Create, `R` = Read, `U` = Update, `D` = Delete, `A` = Approve/Refuse, `—` = No access, `Own` = restricted to the user's own linked employee record.

| Module | Employee | HR Manager | HR Payroll User | HR Payroll Manager | Admin |
|---|---|---|---|---|---|
| Users (User Management) | — | — | — | — | CRUD |
| Employees | R (Own) | CRUD | CRUD *(inherited)* | CRUD | CRUD |
| Contracts | R (Own) | CRUD | CRUD *(inherited)* | CRUD | CRUD |
| Working Schedules | R (Own, assigned) | CRUD | CRUD *(inherited)* | CRUD | CRUD |
| Attendance | C, R (Own) | CRUD (all employees) | CRUD *(inherited)* | CRUD | CRUD |
| Time Off Types | — | CRUD | CRUD *(inherited)* | CRUD | CRUD |
| Time Off Allocations | R (Own) | CRUD | CRUD *(inherited)* | CRUD | CRUD |
| Time Off Requests | C, R (Own) | CRUD, A | CRUD, A *(inherited)* | CRUD, A | CRUD, A |
| Salary Structures | — | — | R only | CRUD | CRUD |
| Salary Rules | — | — | R only | CRUD | CRUD |
| Payruns | — | — | C, R, U (no D) | CRUD | CRUD |
| Payslips | R (Own, read-only, after paid) | — | C, R, U (no D) | CRUD | CRUD |
| Payroll Dashboard | — *(Assumption: no dashboard access)* | R (HR-only metrics: headcount, attendance, time off — no salary figures) | R (full, incl. payroll) | R (full) | R (full) |

### Notes / Assumptions on This Matrix

- **HR Payroll User Delete on Payruns/Payslips:** the official spec only states "Create, Read, and Update" for this role — Delete is intentionally excluded. **This is a direct requirement reading, not an assumption.**
- **HR Manager has zero payroll visibility** ("no access to payroll features") — this includes Salary Structures, Salary Rules, Payruns, and Payslips. **Assumption:** HR Manager also cannot see the Payroll Dashboard's salary figures, but reasonably should see HR-only dashboard sections (attendance, time off, headcount) since those come from modules HR Manager fully owns. Flagged as **Recommended Implementation Decision** — implement a role-aware dashboard that hides salary-specific KPIs/charts from HR Manager.
- **Employee dashboard access** is not mentioned in the official material at all. **Assumption:** Employees do not get a dashboard; they get a simple personal landing page (their profile, own attendance widget, own leave balance) — see `21-UI-UX-GUIDELINES.md`.
- **Employee read of own Payslip:** not explicitly stated, but implied by "view own employee details" in a reasonable HR/payroll product. **Assumption:** Employee can view (read-only) their own finalized (Paid) Payslips, not Draft ones.
- **Time Off Types/Allocations for HR Payroll roles:** the spec says HR Payroll User has "all HR Manager permissions" — since HR Manager has full CRUD on Time Off, this is inherited unchanged. HR Payroll Manager also inherits it unchanged (spec does not alter Time Off permissions for payroll roles beyond what's inherited).

## 4. Route-Level Guard Reference

Use this exact allowed-roles array per action type as the default; deviate only if a specific API contract in `08-API-CONTRACTS.md` says otherwise.

| Action Type | Allowed Roles |
|---|---|
| Employee CRUD | `HR Manager, HR Payroll User, HR Payroll Manager, Admin` |
| Employee self-read | `Employee` (own record only, enforced in controller, not just role) |
| Contract CRUD | `HR Manager, HR Payroll User, HR Payroll Manager, Admin` |
| Working Schedule CRUD | `HR Manager, HR Payroll User, HR Payroll Manager, Admin` |
| Attendance create (self) | `Employee, HR Manager, HR Payroll User, HR Payroll Manager, Admin` |
| Attendance CRUD (any employee) | `HR Manager, HR Payroll User, HR Payroll Manager, Admin` |
| Time Off Type CRUD | `HR Manager, HR Payroll User, HR Payroll Manager, Admin` |
| Time Off Request create (self) | `Employee, HR Manager, HR Payroll User, HR Payroll Manager, Admin` |
| Time Off Request approve/refuse | `HR Manager, HR Payroll User, HR Payroll Manager, Admin` |
| Salary Structure/Rule read | `HR Payroll User, HR Payroll Manager, Admin` |
| Salary Structure/Rule write | `HR Payroll Manager, Admin` |
| Payrun/Payslip create/read/update | `HR Payroll User, HR Payroll Manager, Admin` |
| Payrun/Payslip delete | `HR Payroll Manager, Admin` |
| User Management (all actions) | `Admin` |
| Dashboard read (full) | `HR Payroll User, HR Payroll Manager, Admin` |
| Dashboard read (HR-only subset) | `HR Manager` (additional route or a `scope=hr` query flag) |

## 5. Frontend Enforcement

Backend guards are the **source of truth**. Frontend route guards (`RequireRole`) and conditional nav-item rendering exist purely for UX (hide things a user can't use) — they are **not** a security boundary. Every sensitive backend route must independently re-check roles regardless of what the frontend shows.
