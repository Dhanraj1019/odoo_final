# 13 — Attendance Management

## 1. Purpose

Capture daily presence, worked hours, and exceptions per employee. Feeds Payroll (worked days, unpaid/overtime calculations) and the Payroll Dashboard's Attendance Overview.

## 2. Views Required

1. **Attendance List** — global (all employees, for HR roles) or scoped (from an Employee Form, filtered to that employee). Columns: Employee, Check In, Check Out, Worked Hours, Status.
2. **Attendance Form** — Employee, Date, Check In, Check Out, Worked Hours (computed), Status, correction notes.
3. **Attendance Widget** (self-service, `Employee` role) — shows current clock, a single Check In / Check Out toggle button, and today's running summary (elapsed time since check-in).

## 3. Data Source

See `06-DATABASE-DESIGN.md` §8.

## 4. Check-In / Check-Out Flow

```
POST /api/attendance/check-in
  → find or create today's Attendance doc for req.user.employee
  → if already checked in (checkIn set, checkOut null) → 409 "Already checked in"
  → set checkIn = now

POST /api/attendance/check-out
  → find today's Attendance doc for req.user.employee
  → if no open check-in → 409 "Not checked in"
  → set checkOut = now
  → workedHours = (checkOut - checkIn) in hours, rounded to 2 decimals
  → derive status (see below)
```

## 5. Status Derivation Logic (Recommended Implementation Decision)

The official material leaves exact attendance policy open. This project implements:

```js
function deriveStatus({ checkIn, scheduleStartTime, workedHours, expectedHours, graceMinutes = 15 }) {
  if (!checkIn) return "Absent";
  const lateThreshold = addMinutes(scheduleStartTime, graceMinutes);
  if (checkIn > lateThreshold) return "Late";
  if (workedHours !== null && workedHours < expectedHours / 2) return "Half Day";
  return "Present";
}
```

- `scheduleStartTime` / `expectedHours` come from the employee's applicable Working Schedule for that weekday (see `12-WORKING-SCHEDULE.md` §5).
- A day with no schedule entry (e.g., a weekend/off day) is not evaluated for Absent/Late status at all.

## 6. Manual Corrections

- Restricted to `HR Manager, HR Payroll User, HR Payroll Manager, Admin`.
- Any `PUT /api/attendance/:id` by these roles sets `isManualCorrection: true` and `correctedBy: req.user._id`, and the record is visibly flagged in the list (e.g., an edit icon) — this feeds the dashboard's "manual edits" count.

## 7. Role Behavior

| Role | Behavior |
|---|---|
| Employee | Can check in/out for themselves; can view only their own attendance history. Cannot create/edit records for other dates directly (no manual "add attendance" form) — only the check-in/out widget. |
| HR Manager, HR Payroll User, HR Payroll Manager, Admin | Full CRUD on any employee's attendance, including manual entries/corrections. |

## 8. Frontend Components

- `AttendanceListTable`
- `AttendanceForm` (HR-facing, with correction fields)
- `AttendanceWidget` (self-service check-in/out, shown on the Employee's personal landing page and optionally in the top header for any logged-in employee)

## 9. Dashboard Feed

Attendance records are the source for the dashboard's: Present/Late/Absent/Overtime counts, missing-checkout count (`checkIn` set, `checkOut` null, for a date in the past), manual-edit count (`isManualCorrection: true`), and attendance coverage % (`records with checkIn / expected working-day records` for the selected period). See `19-PAYROLL-DASHBOARD-AND-REPORTING.md`.
