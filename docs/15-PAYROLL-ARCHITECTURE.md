# 15 — Payroll Architecture

## 1. Purpose

Define how a **Payrun** turns selected employees into computed, validated, paid **Payslips**, per the official two-step wizard and Draft → Compute → Validate → Mark Paid lifecycle.

## 2. Payrun Creation Wizard (Two-Step, Exactly as Specified)

### Step 1 — Scope
Frontend collects: `salaryStructure`, `periodStart`/`periodEnd` (or a single "Period" picker that derives both), optionally `department`/`employeeType` as scope filters. Clicking **Continue** does **not** hit `POST /api/payruns` — it calls `GET /api/payruns/eligible-employees?...` to move to Step 2. **No Payrun record is created yet.**

### Step 2 — Employee Selection
Frontend shows the eligible-employee list (from the query above) with checkboxes (Employee, Working Hours, Start Date, Wage columns, per the mockup). User selects specific employees. Clicking **Create Payrun** calls `POST /api/payruns` with `selectedEmployees[]` — **this is the only point where the Payrun record is actually created.**

### Eligible Employees Query (`eligible-employees` endpoint)
```js
async function getEligibleEmployees({ periodStart, periodEnd, department, employeeType }) {
  const employees = await Employee.find({
    status: "Active",
    ...(department && { department }),
    ...(employeeType && { employeeType })
  });
  // annotate each with their period-applicable contract resolution (contract may be null; issue may be set)
  return Promise.all(employees.map(async (emp) => ({
    employee: emp,
    ...(await contractService.resolveApplicableContract(emp._id, periodStart, periodEnd))
  })));
}
```
Employees with no applicable contract (`issue: "NO_CONTRACT"`) or a mid-period contract change (`issue: "CONTRACT_PERIOD_MISMATCH"`, see `11-CONTRACT-MANAGEMENT.md` §4) are still shown but visually flagged so the HR Payroll user makes an informed choice about whether to include them.

## 3. Payrun Creation

`POST /api/payruns` with `{ salaryStructure, periodStart, periodEnd, selectedEmployees }`:

1. Create the `Payrun` document, `status: 'Draft'`.
2. For each `employeeId` in `selectedEmployees`, create a `Payslip` document, `status: 'Draft'`, with `contract` resolved via `contractService.resolveApplicableContract`. If `issue: "NO_CONTRACT"`, still create the Payslip but immediately push `"No active contract for this period"` into its `warnings`. If `issue: "CONTRACT_PERIOD_MISMATCH"`, still create the Payslip but push `"Contract changed mid-period — payroll period is not fully covered by a single contract"` into its `warnings`; this Payslip is excluded from normal computation in the Compute step below.
3. Return the created Payrun with its Payslip summary.

## 4. Compute Step

`POST /api/payruns/:id/compute`:

For each Payslip in the run:
0. If the Payslip's `warnings` already include a contract-related issue from creation time (`"No active contract..."` or `"Contract changed mid-period..."`), **skip steps 1–5 for this Payslip** — leave `lines[]` empty and `netSalary` unset/`0`, keep the existing warning, and move to the next Payslip. Do not attempt partial computation against only one of the split contracts.
1. Load the employee's applicable `Contract` and the Payrun's `SalaryStructure` (with its ordered `rules[]`, each fully populated).
2. Gather **input variables** for the formula engine (see `16-PAYROLL-FORMULA-ENGINE.md` §2): `CONTRACT_WAGE`, `WORKED_DAYS`, `UNPAID_LEAVE_DAYS`, `OVERTIME_HOURS`, plus a running map of already-computed rule results keyed by `code`.
3. Iterate `salaryStructure.rules` **in order**, computing each rule's `amount` per its `computationMethod` (Fixed / Percentage / Formula), storing the result into the running map so later rules can reference earlier ones by `code`.
4. Aggregate: `grossSalary` = sum of rules with `category` in `['Basic', 'Allowance', 'Gross']` (Recommended Implementation Decision: Gross itself is typically a rule that sums Basic+Allowances via formula, so avoid double-counting — see note below); `totalDeductions` = sum of `category: 'Deduction'`; `netSalary` = Gross − Deductions, or read directly from a `Net`-category rule if one is defined to compute it explicitly.
5. Populate `payslip.lines[]` with each rule's `{ salaryRule, code, name, category, amount }`.
6. Run warning checks (§6 below) and populate `payslip.warnings`.
7. Set `payslip.status = 'Computed'`.
8. Set `payrun.status = 'Computed'`, `payrun.computedAt = now`, and roll up all payslip warnings into `payrun.warnings`.

**Double-counting note:** to avoid summing a `Gross` category rule's value into itself when it's also composed of Basic+Allowances, the safest convention (documented for whoever builds the seed Salary Structure) is: `grossSalary` field on the Payslip = the value of the rule whose `category === 'Gross'` (there should be exactly one such rule per structure), not a sum of all category-tagged rows. Likewise `netSalary` = the value of the single `category: 'Net'` rule. This keeps the engine simple and avoids ambiguous aggregation logic.

## 5. Validate Step

`POST /api/payruns/:id/validate`: re-runs the same warning checks (§6) on the current computed state (in case underlying data changed since compute), and only transitions to `status: 'Validated'` — this does **not** recompute amounts, only re-verifies data integrity. If new blocking warnings appear, the frontend surfaces them and the user may need to re-Compute.

**Recommended Implementation Decision:** warnings are informational, not hard-blocking, for the hackathon (the spec says "highlight" and "surface... before finalization," not "prevent"). The HR Payroll user can proceed past warnings deliberately. Do not silently prevent `Validate`/`Mark Paid` — show a confirmation dialog instead if warnings exist.

## 6. Warning Checks

Run against every Payslip in the run:

| Warning | Condition |
|---|---|
| Missing bank details | `employee.bankDetails.accountNumber` is empty |
| No active contract | `resolveApplicableContract` returned `issue: "NO_CONTRACT"` |
| Contract changed mid-period | `resolveApplicableContract` returned `issue: "CONTRACT_PERIOD_MISMATCH"` — normal computation is skipped for this Payslip (see §4 step 0) |
| Duplicate payslip | another **existing** Payslip (outside this run) already covers this `employee` + overlapping period |
| Negative net salary | `netSalary < 0` |

## 7. Mark Paid Step

`POST /api/payruns/:id/mark-paid`: sets `payrun.status = 'Paid'`, `paidAt = now`, cascades every Payslip in the run to `status: 'Paid'`. Paid Payruns/Payslips are immutable historical records — no further edits (`PUT`/`DELETE` on a Paid Payslip/Payrun must return `403`).

## 8. Send Payslips Step

`POST /api/payruns/:id/send-payslips`: for each Payslip, generate/attach a PDF (see `18-PAYSLIP-PDF-AND-EMAIL-DELIVERY.md`) and email it to the employee's address via Nodemailer. Sets `payrun.payslipsSentAt = now` and `payslip.emailSentAt = now` per successfully-sent payslip. Failures for individual employees should not abort the whole batch — collect and report a per-employee send-status summary in the response.

## 9. Historical Integrity

Once `Paid`, a Payrun/Payslip is retained forever as a historical record — no deletion. `DELETE` is only permitted on `Draft` Payruns (and cascades to delete their Draft Payslips).

**Payslip line items are frozen snapshots, not live references.** `Payslip.lines[]` stores a denormalized copy of each rule's `{ salaryRule, code, name, category, amount }` at the moment of computation (see `06-DATABASE-DESIGN.md` §15) — it does not re-read the `SalaryRule` document at display time. Consequently: editing or archiving a `SalaryRule` or `SalaryStructure` **after** a Payslip has been computed must never change that Payslip's already-stored `lines[]`, `grossSalary`, `totalDeductions`, or `netSalary`. A `Computed`-status Payslip may still be legitimately recomputed (§4/§5 above, while the Payrun is `Draft`/`Computed`) using whatever the *current* rule definitions are at that time — that's an intentional recompute, not a retroactive mutation. Once `Validated` or `Paid`, recompute is blocked entirely (§5), which is what makes the snapshot permanent.

## 10. State Diagram

```
Draft --(compute)--> Computed --(validate)--> Validated --(mark-paid)--> Paid
                                                                            |
                                                                    (send-payslips)
                                                                            |
                                                                        Paid (emailed)
```
A Payrun can be re-computed while in `Draft`/`Computed` (e.g., after fixing a contract) — recompute simply re-runs §4 and overwrites prior line/warning data. Once `Validated` or `Paid`, recompute is blocked.
