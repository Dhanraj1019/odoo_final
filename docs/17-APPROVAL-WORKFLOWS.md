# 17 — Approval Workflows

This file consolidates the two distinct approval-style workflows in the system so an implementing agent doesn't confuse them.

## 1. Time Off Request Approval (True Approval Workflow)

A person-driven approve/refuse decision on a specific request.

```
Employee submits Time Off Request  →  status: 'Submitted'
                                          |
                          HR Manager / HR Payroll User / HR Payroll Manager / Admin
                                          |
                    ┌─────────────────────┴─────────────────────┐
                 Approve                                      Refuse
                    |                                             |
        status: 'Approved'                             status: 'Refused'
        + deduct from Allocation                        + reason recorded
        (if requiresAllocation)                         (no balance change)
```

Full detail and edge cases (insufficient balance, etc.) are in `14-TIME-OFF-MANAGEMENT.md` §6. Key rule: **only one decision, no multi-step chain** — the spec calls for "a simple approval flow," not a multi-level approval chain. Do not build multi-stage approvals (e.g., manager → HR → Admin) — that would be over-engineering beyond the stated scope.

## 2. Payroll Status-Gated Workflow (Not a Person-to-Person Approval)

This is **not** an approval-request-to-a-person model. It's a **sequential status gate** operated by whoever has payroll permissions, on a batch (Payrun), not routed to a specific approver:

```
Draft --[Compute]--> Computed --[Validate]--> Validated --[Mark Paid]--> Paid --[Send Payslips]--> Paid (emailed)
```

- Any user with Payrun write access (`HR Payroll User`, `HR Payroll Manager`, `Admin`) can perform each transition — there is no separate "approver" role for payroll in the official spec.
- Each transition is a deliberate user-triggered action (a button click), never automatic.
- Full detail on each transition's side effects: `15-PAYROLL-ARCHITECTURE.md`.

## 3. Why These Are Kept Separate

Conflating these two models (e.g., trying to make Payrun validation route to a specific "approver" the way Time Off does) would introduce complexity not present in the official material and would risk breaking the two-step Payrun creation wizard's intended simplicity. Keep them as architecturally distinct concepts:

| | Time Off Approval | Payroll Workflow |
|---|---|---|
| Trigger | Employee submits a request | HR Payroll user manually advances a batch |
| Decision-maker | Any HR Manager+ role, acting on someone else's request | Same actor typically drives the whole Payrun lifecycle themselves |
| Reversibility | Approve/Refuse is generally final (no re-submission flow required) | Draft/Computed can be re-run; Validated/Paid is locked |
| Data effect | Mutates a Time Off Allocation balance | Mutates Payslip line amounts and statuses |

## 4. Notifications (Explicit Scope Note)

The official material does not require an in-app or email notification system for Time Off approvals (e.g., "notify employee when their leave is approved"). **Assumption:** no notification system is built for the hackathon; the Requests list simply reflects updated status, visible next time the employee views it. This is flagged as a **Future Roadmap** item, not a missing core requirement.
