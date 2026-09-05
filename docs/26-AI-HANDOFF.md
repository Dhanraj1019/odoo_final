# 26 — AI Handoff

**Read this file first if you are an AI agent picking up this project in a new session.** It tells you how to orient yourself and what not to break.

## 1. What This Project Is

PeoplePay360 — an integrated HRMS + Payroll platform for Odoo Hackathon 2026. Full context: `00-PROJECT-OVERVIEW.md`, `01-HACKATHON-REQUIREMENTS.md`, `02-OFFICIAL-WORKFLOW.md`.

The central business workflow, which every module must serve rather than bypass:

```
Employee → Contract → Working Schedule → Attendance + Time Off → Payroll → Payrun → Payslip → PDF + Email
```

## 2. Required Reading Order (Do Not Skip Steps)

1. `00-PROJECT-OVERVIEW.md` — orientation.
2. `25-CURRENT-PROGRESS.md` — what's actually done vs. not, right now.
3. Whichever of `22-BACKEND-TODO.md` / `23-FRONTEND-TODO.md` is relevant to the next task, per the phase noted in `25-CURRENT-PROGRESS.md`.
4. The specific module doc(s) for whatever you're about to touch (e.g., implementing Contracts → read `11-CONTRACT-MANAGEMENT.md` and `06-DATABASE-DESIGN.md` §6).
5. `05-RBAC-ROLES-PERMISSIONS.md` — whenever you add a route, to apply the correct role guard.

Then: identify the next unchecked TODO item, implement **only** that item (or a small tightly-related cluster of items), test it, check it off, update `25-CURRENT-PROGRESS.md`. Do not jump ahead to a later phase. Do not implement multiple unrelated phases in one pass.

## 3. Locked Decisions — Do Not Re-litigate

These were explicitly confirmed by the project owner. Do not "improve," simplify away, or silently reverse any of these, even if a shortcut seems tempting:

- **No public signup.** Admin creates Users, links them to an Employee, assigns role(s). Login-only public flow.
- **Session-based auth only** — Passport + passport-local + express-session + connect-mongo + bcryptjs. Never JWT.
- **Exactly 5 roles**, no more, no fewer: Admin, HR Manager, HR Payroll User, HR Payroll Manager, Employee.
- **Multi-role, union permissions, role-intersection route access.** A user can hold multiple roles; effective permissions are the union of all their roles' permissions; a route's allowed-roles list is satisfied if the user has at least one matching role. Ownership checks (e.g., an Employee reading their own record) are a **separate, mandatory** layer on top of role checks — role-union logic must never be used to bypass ownership.
- **No `eval()`, no `new Function()`, no Python execution, no `child_process` to any interpreter.** Salary formulas run through the custom tokenizer/parser/evaluator in `16-PAYROLL-FORMULA-ENGINE.md` only.
- **`SalaryStructure.rules[]` array order = actual execution order.** `SalaryRule.sequence` is display metadata only — never read it for execution or validation ordering.
- **One contract per payroll period, no proration.** If a payroll period isn't fully covered by exactly one Active contract, flag it (`CONTRACT_PERIOD_MISMATCH`) and exclude that employee from normal computation — never silently pick a contract or split/prorate.
- **Leave-day duration follows the employee's Working Schedule**, not a hardcoded Mon–Fri assumption (Mon–Fri is only a last-resort fallback when no schedule resolves).
- **Validated/Paid Payslips are immutable.** `Payslip.lines[]` is a frozen snapshot; later Salary Rule/Structure edits never retroactively change historical Payslips.
- **No permanent left sidebar** as the primary desktop nav — top header + module navigation. No cyberpunk/terminal/hacker theme anywhere.
- **MongoDB is local only** — no cloud services, no deployment config needed.
- **Backend-first, TODO-driven, sequential.** Don't jump between modules.

## 4. Open Item Requiring a Human Decision

See `25-CURRENT-PROGRESS.md` §3 — a minor nav-structure ambiguity between the PDF text (mentions a separate "Reports" item) and the official mockup images (no separate "Reports" tab; Dashboard nested under Payroll). Currently following the images. Flag it again if you're about to build `20-FRONTEND-ARCHITECTURE.md`'s nav shell and no resolution has been recorded yet.

## 5. What NOT To Do

- Do not regenerate any existing documentation file wholesale "to be safe." If something looks off, make a targeted correction and explain why, the way the audit in `25-CURRENT-PROGRESS.md` §2 did.
- Do not invent new roles, new top-level modules, or new approval chains beyond what's documented — check `05-RBAC-ROLES-PERMISSIONS.md` §1 and `17-APPROVAL-WORKFLOWS.md` §3 first.
- Do not build contract proration/splitting logic — explicitly out of scope (§3 above).
- Do not add a permission/ACL engine, generic RBAC table, or notification system unless a doc explicitly asks for it — these were deliberately rejected as over-engineering for hackathon scope (see `05-RBAC-ROLES-PERMISSIONS.md` §2, `17-APPROVAL-WORKFLOWS.md` §4).
- Do not treat the pre-existing legacy codebase (old theme, public signup, possible JWT remnants) as authoritative — this documentation set is authoritative; the legacy code is only a possible source of reusable plumbing (see `09-AUTHENTICATION-AND-USER-MANAGEMENT.md` §1 on preserving-then-repurposing old signup code).
- Do not mark a TODO phase complete without the corresponding manual test listed next to it in `22-BACKEND-TODO.md`/`23-FRONTEND-TODO.md` actually passing.

## 6. If You Find a New Contradiction

Distinguish (and label as such, in whatever doc you touch):
- **Official Requirement** — stated in the PDF or mockup images.
- **Assumption** — a reasonable default filling a genuine gap in the official material.
- **Recommended Implementation Decision** — a technical choice made to satisfy an official requirement given the confirmed Node.js/MongoDB/session-auth stack.

Never silently present an Assumption or Recommended Implementation Decision as if it were an Official Requirement. If official material conflicts with existing documentation, official material wins — but make a small targeted fix, note it in `25-CURRENT-PROGRESS.md`, and move on; do not use it as license to rewrite unrelated sections.
