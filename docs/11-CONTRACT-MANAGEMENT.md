# 11 — Contract Management

## 1. Purpose

Maintain **historical** contract records per employee, while guaranteeing payroll only ever uses the **one contract applicable to the period being processed.**

## 2. Views Required

1. **Contracts List** — Employee, Start Date, End Date, Wage/Month, Status — the active contract is visually highlighted (e.g., a green "Active" badge; other statuses shown muted).
2. **Contract Form** — Employee (locked once created), Department, Job Position, Start Date, End Date (nullable = open-ended), Wage/Month, Salary Structure, Working Schedule (optional override), Status.

## 3. Data Source

See `06-DATABASE-DESIGN.md` §6.

## 4. Core Business Rule: Period-Applicable Contract Resolution

This is the single most important business rule in the whole platform — it is referenced by Attendance, Time Off payroll-integration, and Payslip computation.

**Requirement (hackathon-friendly decision — see `15-PAYROLL-ARCHITECTURE.md` §6 for the full warning-check table):** an employee included in a Payrun must have **exactly one** contract whose date range fully covers the entire payroll period (`periodStart`–`periodEnd`). Do not silently pick "the latest" or "the best match" contract when more than one contract overlaps the period — that would compute payroll against only part of the period without telling anyone. This project explicitly does **not** implement contract proration/splitting across a mid-period contract change; that is out of scope for the hackathon timeline.

```js
// contract.service.js
async function resolveApplicableContract(employeeId, periodStart, periodEnd) {
  // Find every Active contract that overlaps the period at all.
  const overlapping = await Contract.find({
    employee: employeeId,
    status: "Active",
    startDate: { $lte: periodEnd },
    $or: [{ endDate: null }, { endDate: { $gte: periodStart } }]
  });

  if (overlapping.length === 0) {
    return { contract: null, issue: "NO_CONTRACT" };
  }

  // Exactly one contract must span the WHOLE period, not just overlap part of it.
  const fullyCovering = overlapping.filter(
    (c) => c.startDate <= periodStart && (c.endDate === null || c.endDate >= periodEnd)
  );

  if (fullyCovering.length === 1) {
    return { contract: fullyCovering[0], issue: null };
  }

  // Either zero contracts fully cover the period (a mid-period contract change occurred),
  // or — defensively — more than one does (should be prevented by overlap-prevention in §5,
  // but checked here too). Both cases are a contract issue, not a silent pick.
  return { contract: null, issue: "CONTRACT_PERIOD_MISMATCH" };
}
```

**Resulting behavior:**
- `issue: "NO_CONTRACT"` → the employee's Payslip is created (or included in eligible-employees) with a `"No active contract for this period"` warning.
- `issue: "CONTRACT_PERIOD_MISMATCH"` → the employee's Payslip is created with a `"Contract changed mid-period — payroll period is not fully covered by a single contract"` warning, and normal salary computation is **skipped** for that employee (no `lines[]` are computed; `netSalary` stays `0`/unset). The HR Payroll user must resolve this manually (e.g., split the Payrun's period, or run separate Payruns aligned to the contract boundaries) — this project does not auto-split or prorate.
- Only when exactly one contract fully covers the period does normal computation proceed.

If no applicable contract is found for an employee included in a Payrun, that employee's Payslip computation must fail gracefully with a **warning** rather than crashing the whole Payrun compute step — see `15-PAYROLL-ARCHITECTURE.md`.

## 5. Overlap Prevention

Before creating/updating a contract to `status: 'Active'`, check for any other `Active` contract on the same employee whose date range overlaps:

```js
const overlap = await Contract.findOne({
  employee, status: "Active", _id: { $ne: currentId },
  startDate: { $lte: newEndDate || Infinity-equivalent },
  $or: [{ endDate: null }, { endDate: { $gte: newStartDate } }]
});
if (overlap) throw new ApiError(409, "Employee already has an overlapping active contract");
```

**Recommended Implementation Decision:** reject the overlap outright (do not silently auto-expire the old contract) — this keeps the business rule explicit and visible to the HR user, matching the spec's instruction to "avoid concurrent active contracts."

## 6. Role Behavior

Only `HR Manager, HR Payroll User, HR Payroll Manager, Admin` can view/manage Contracts. `Employee` sees their own contract history read-only via `GET /api/employees/me` (embed a lightweight contract summary, or a dedicated `GET /api/contracts?employee=me` self-scoped route — **Recommended Implementation Decision**, since the spec grants Employees visibility into "employee details" broadly).

## 7. Frontend Components

- `ContractListTable` (with active-contract highlight)
- `ContractForm`
- `ContractStatusBadge` (Draft/Active/Expired/Cancelled)

## 8. Assumptions

- `contractReference` (e.g., `COM/2026/0042`) is auto-generated server-side using a simple incrementing sequence per year — not specified in the source material but shown in the mockup form title; treat as a **Recommended Implementation Decision**, not a hard requirement to replicate exactly.
