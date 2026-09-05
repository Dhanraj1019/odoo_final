# 12 — Working Schedule

## 1. Purpose

Define the weekly working-hours pattern used by Attendance (to derive Late/Absent status and worked-hours expectations) and Payroll (to derive daily/hourly rates from a monthly wage, e.g., `dailyRate = wagePerMonth / (totalWeeklyHours/7 * daysInMonth)` style calculations inside the formula engine).

## 2. Views Required

1. **Working Schedules List** — Name, Days/Week, Hours/Week (computed), Company, Status.
2. **Working Schedule Form** — a 7-row weekly grid (Day, Start Time, End Time, Break), with a **read-only computed Total Weekly Hours** field.

## 3. Data Source

See `06-DATABASE-DESIGN.md` §7.

## 4. Computed Hours Logic

```js
// models/WorkingSchedule.js — pre-save hook
schema.pre("save", function (next) {
  const totalMinutes = this.days.reduce((sum, d) => {
    const start = parseTimeToMinutes(d.startTime);
    const end = parseTimeToMinutes(d.endTime);
    const worked = Math.max(0, end - start - (d.breakMinutes || 0));
    return sum + worked;
  }, 0);
  this.totalWeeklyHours = Number((totalMinutes / 60).toFixed(2));
  next();
});
```

`totalWeeklyHours` must **never** be accepted as client input — always recomputed server-side on every save.

## 5. Assignment

A Working Schedule can be assigned to:
1. An **Employee** (`Employee.workingSchedule`) — the default.
2. A **Contract** (`Contract.workingSchedule`, optional) — overrides the employee default for that contract's active period.

Resolution order when Attendance/Payroll needs "the applicable schedule" for a given date: use the period-applicable Contract's `workingSchedule` if set, else fall back to `Employee.workingSchedule`.

## 6. Scope Boundary (Explicit Assumption)

The official material says shift/flexible-time rules are **"open to interpretation."** This project implements **only fixed weekly-pattern schedules** (one start/end/break per weekday). Shift rotation, flexible-hours banking, and multi-shift-per-day patterns are explicitly **out of scope** for the hackathon timeline. If time remains after core scope, this can be revisited — track as a `Future Roadmap` item, not a blocking task.

## 7. Role Behavior

`HR Manager, HR Payroll User, HR Payroll Manager, Admin` — full CRUD. `Employee` — read-only, sees their own resolved schedule via `GET /api/employees/me`.

## 8. Frontend Components

- `WorkingScheduleListTable`
- `WorkingScheduleForm` (7-row weekly grid, live-recalculating total hours client-side for UX, but always trusting the server-returned value as final truth)
