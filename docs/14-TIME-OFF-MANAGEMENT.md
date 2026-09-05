# 14 — Time Off Management

## 1. Purpose

Manage the full leave lifecycle: defining leave **Types**, allocating **balances**, and processing **Requests** with approval.

## 2. Sub-Modules & Views

Navigation (per official mockup, under a `Time Off` top-nav item): `Dashboard | Time off (Requests) | Time off Types | Allocations`

1. **Time Off Types List/Form** — Name, Unit (Days/Hours), Requires Allocation, Requires Approval, Affects Payroll (Is Paid).
2. **Allocations List/Form** — Employee, Type, Allocated, Taken, Remaining (virtual), Validity dates, Status.
3. **Requests List/Form** — Employee, Type, Start/End Date, Duration, Status, Approve/Refuse actions.

## 3. Data Source

See `06-DATABASE-DESIGN.md` §§9–11.

## 4. Time Off Type Configuration

- `unit`: `Days` or `Hours` — determines how `duration` is computed on requests of this type.
- `requiresAllocation`: if `true`, a request can only be approved if the employee has a matching, approved Allocation with sufficient `remainingAmount`. If `false` (e.g., unpaid leave / compassionate leave), no balance check is needed.
- `requiresApproval`: if `false`, a request auto-transitions to `Approved` on submission (**Assumption** — the spec says requests "support a simple approval flow," implying approval is generally expected; this flag exists for flexibility but the seed data should set `requiresApproval: true` for all demo types).
- `affectsPayroll` / `isPaid`: read by the formula engine (`UNPAID_LEAVE_DAYS` variable, see `16-PAYROLL-FORMULA-ENGINE.md`) to determine whether approved leave in the payroll period reduces pay.

## 5. Allocation Lifecycle

1. Created (by HR Manager+) with `status: 'Pending Approval'`.
2. Approved (`PUT /api/time-off-allocations/:id/approve`) → `status: 'Approved'`, now counts toward `remainingAmount`.
3. `takenAmount` auto-increments only through the Request-approval flow below — never edited directly by users.

## 6. Request Approval Flow

```
POST /api/time-off-requests { employee (self), timeOffType, startDate, endDate, reason }
  → duration computed server-side based on timeOffType.unit
     - Days: working-day count between startDate/endDate inclusive, where a "working day" is any date on which the employee's **applicable Working Schedule** (resolved per `12-WORKING-SCHEDULE.md` §5) has at least one scheduled day-entry. Non-scheduled days (whatever the schedule defines as off — not assumed to be Sat/Sun) are excluded from the count.
     - Hours: explicit start/end time delta if the type is hour-based (Assumption: simple duration field for the hackathon, no half-day granularity required)
  → status: 'Submitted'

PUT /api/time-off-requests/:id/approve
  → if timeOffType.requiresAllocation:
      find employee's Approved Allocation for this type where remaining >= duration
      if none found → 409 "Insufficient leave balance"
      else → allocation.takenAmount += duration
  → request.status = 'Approved', approvedBy = req.user._id, actionedAt = now

PUT /api/time-off-requests/:id/refuse
  → request.status = 'Refused', approvedBy = req.user._id, actionedAt = now, reason optional
```

## 7. Role Behavior

| Role | Behavior |
|---|---|
| Employee | Create own requests, view own requests/allocations/balance. Cannot approve, cannot manage Types/Allocations directly. |
| HR Manager, HR Payroll User, HR Payroll Manager, Admin | Full CRUD on Types, Allocations, Requests; approve/refuse any request. |

## 8. Frontend Components

- `TimeOffTypeListTable` / `TimeOffTypeForm`
- `AllocationListTable` / `AllocationForm`
- `TimeOffRequestListTable` (with inline Approve/Refuse actions for authorized roles)
- `TimeOffRequestForm`
- `LeaveBalanceCard` (shown on the Employee's self-service landing page — Type, Remaining, Validity)

## 9. Assumptions Summary

- Working-day-only duration calculation for `Days`-unit types: driven by the employee's **applicable Working Schedule** (see §6 above), never a hardcoded Mon–Fri assumption. If an employee has no Working Schedule resolvable at request time, fall back to a standard Mon–Fri calendar as a last-resort default and flag this on the request via a `warnings`-style note — **Recommended Implementation Decision**, since the official material leaves exact leave-duration policy "open to interpretation."
- No partial-day ("half day leave") granularity — a request is whole-duration only.
- No leave-type-specific carry-forward/expiry automation beyond the `validTo` date already present on Allocation (an expired allocation simply stops counting toward `remainingAmount` in queries: `validTo >= today`).
