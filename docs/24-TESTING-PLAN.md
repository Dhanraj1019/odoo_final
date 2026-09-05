# 24 — Testing Plan

## 1. Philosophy

This is a hackathon project — the testing strategy prioritizes **manual, scenario-based verification** of the two official demo flows, plus targeted checks on the highest-risk logic (formula engine, contract overlap, allocation deduction, RBAC). Full automated test coverage is not required, but is welcomed where time allows.

## 2. High-Risk Areas Requiring Explicit Verification

| Area | Why it's high-risk | How to verify |
|---|---|---|
| Formula Engine | Security-critical (must never execute arbitrary code) + core to payroll accuracy | Unit tests per `22-BACKEND-TODO.md` Phase 9; manual formula test cases covering every operator/function |
| Contract overlap prevention | Silent bugs here corrupt payroll periods | Create deliberately overlapping contracts, confirm rejection |
| Time Off allocation deduction | Balance math errors are highly visible/embarrassing in a demo | Approve requests up to and beyond remaining balance, confirm correct accept/reject |
| RBAC route guards | A missed guard is a real security hole | Manual pass: log in as each of the 5 roles, attempt every restricted action, confirm `403`s |
| Payrun state machine | Incorrect transitions corrupt payroll history | Attempt invalid transitions (e.g., mark-paid on a Draft, edit a Paid payslip), confirm blocked |
| Dashboard "live data" requirement | Explicit official requirement — no hardcoded values | Change underlying data, refresh dashboard, confirm numbers change accordingly |

## 3. Manual Test Script — Scenario 1: Employee-to-Payslip

1. As Admin, create an Employee, a Working Schedule, and assign both.
2. As HR Manager, create a Contract for the employee with a Salary Structure.
3. As the Employee, check in and check out for several days (or seed historical attendance).
4. As HR Payroll User, create a Payrun for the current period, select the employee in Step 2, create the Payrun.
5. Compute the Payrun — verify the Payslip's line items match hand-calculated expected values for the structure's rules.
6. Validate, then Mark Paid.
7. Print the Payslip PDF — verify it renders correctly with matching figures.
8. Send Payslips — verify the employee's configured email receives it (sandbox SMTP) or the failure is reported cleanly.
9. As the Employee, view their own Paid payslip read-only.

## 4. Manual Test Script — Scenario 2: Leave Allocation-to-Request

1. As HR Manager, create a Time Off Type (e.g., "Paid Time Off", `requiresAllocation: true`).
2. Create and approve an Allocation for an Employee (e.g., 12 days).
3. As the Employee, submit a Time Off Request within the balance.
4. As HR Manager, approve the request — verify `takenAmount` increments and `remainingAmount` decreases correctly on the Allocation.
5. As the Employee, submit a second request exceeding the remaining balance.
6. As HR Manager, attempt to approve — verify rejection with a clear balance-insufficiency message.
7. Confirm the Payroll Dashboard's Time Off Overview reflects the approved days.

## 5. RBAC Verification Checklist

For each of the 5 roles, attempt (and record pass/fail for):
- [ ] Access to `/api/users` (expect: only Admin succeeds)
- [ ] Write access to Salary Structures/Rules (expect: only HR Payroll Manager/Admin succeeds; HR Payroll User read-only; HR Manager/Employee fully blocked)
- [ ] Access to Payruns/Payslips (expect: HR Manager blocked entirely; HR Payroll User CRU only, no delete; HR Payroll Manager/Admin full)
- [ ] Approve/Refuse a Time Off Request (expect: HR Manager+ succeeds, Employee blocked)
- [ ] Access another employee's Attendance record (expect: only HR Manager+ succeeds; Employee blocked even for another employee's own data)

## 6. Formula Engine Test Cases

| Input | Expected |
|---|---|
| `BASIC * 0.20` | Numeric result, 20% of Basic |
| `MAX(BASIC * 0.20, 3000)` | Larger of the two values |
| `ROUND(CONTRACT_WAGE / TOTAL_WORKING_DAYS * WORKED_DAYS, 2)` | Correctly rounded prorated wage |
| `IF(UNPAID_LEAVE_DAYS > 0, -1 * (CONTRACT_WAGE / TOTAL_WORKING_DAYS) * UNPAID_LEAVE_DAYS, 0)` | Negative deduction only when unpaid leave exists |
| `eval("1+1")` (deliberately malformed/malicious) | Rejected at parse/validation time — `eval` is not a recognized identifier or function |
| Reference to a later-sequenced rule's code | Rejected at structure-save time (circular/forward-reference check) |
| Reference to an unknown identifier `FOO` | Rejected at rule-save time |

## 7. Regression Checklist (Run Before the Live Demo)

- [ ] Fresh seed data loads cleanly on a clean local MongoDB
- [ ] Login works for all 5 seeded demo accounts
- [ ] Both official demo scenarios run start-to-finish without errors
- [ ] Dashboard shows non-empty, plausible charts/KPIs
- [ ] No console errors in the browser during the full click-through
- [ ] No leftover placeholder/lorem-ipsum text visible anywhere in the UI
