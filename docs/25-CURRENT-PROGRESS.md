# 25 — Current Progress

**This is a living document.** Update it after every meaningful chunk of implementation work — not necessarily after every single TODO checkbox, but never let more than a few tasks pass unrecorded. This is the **first file** any implementing agent should read after the core documentation set, per `26-AI-HANDOFF.md`.

## 1. Overall Project Status

**Phase: BACKEND 100% COMPLETE & VERIFIED — PROCEEDING TO FRONTEND (Phase 14).**

- All 13 Backend Phases (`1`–`13`) are 100% implemented, hardened, and verified via automated test suites.
- Full representative seed dataset implemented (`backend/src/utils/seed.js` / `npm run seed`) covering 5 canonical users, 5 departments, 10 job positions, 2 working schedules, 10 employees with active contracts, 8 salary rules with corporate structure, attendance history across 3 months, time off types/allocations/requests, and paid payruns with frozen payslips.
- All 16 backend route groups strictly guarded by RBAC middleware matching `05-RBAC-ROLES-PERMISSIONS.md` §4.
- Security audit passed: zero passwordHash leakage across all API surfaces, session cookies configured, and `.env` properly isolated.

## 2. Documentation Audit Summary

An audit was performed comparing the previously-generated Markdown docs against:
1. The official Hackathon Problem Statement PDF.
2. The official Excalidraw workflow mockup images (Login/User Access, Employee & Contract, Working Schedule, Attendance, Time Off, Payrun/Payslip, Salary Structures/Rules, Payroll Dashboard).

**Result:** the vast majority of existing documentation was already correct and required no changes. Five targeted corrections were applied (not full-file regenerations):

| # | File(s) corrected | Issue |
|---|---|---|
| 1 | `08-API-CONTRACTS.md` | Invalid date `2026-02-29` (2026 is not a leap year) → `2026-02-28` |
| 2 | `11-CONTRACT-MANAGEMENT.md`, `15-PAYROLL-ARCHITECTURE.md` | `resolveApplicableContract` silently picked a contract when a payroll period was split across two contracts mid-period; now returns a `CONTRACT_PERIOD_MISMATCH` issue, surfaces a warning, and **skips** normal computation for that employee instead of guessing |
| 3 | `16-PAYROLL-FORMULA-ENGINE.md`, `06-DATABASE-DESIGN.md` | Circular-dependency validation incorrectly used `SalaryRule.sequence`; corrected to use `SalaryStructure.rules[]` array position — the confirmed single source of truth for execution order. `sequence` is now explicitly documented as display metadata only |
| 4 | `14-TIME-OFF-MANAGEMENT.md` | Internal contradiction — one section said leave-day exclusion follows the employee's Working Schedule, another said it's a hardcoded Mon–Fri assumption. Resolved: Working Schedule is the source of truth, Mon–Fri is only a last-resort fallback if no schedule resolves |
| 5 | `15-PAYROLL-ARCHITECTURE.md` | Added an explicit statement that `Payslip.lines[]` is a frozen snapshot — later edits to a `SalaryRule`/`SalaryStructure` never retroactively alter an already-computed Payslip |

Two files were newly generated (not present before): this file (`25-CURRENT-PROGRESS.md`) and `26-AI-HANDOFF.md`.

## 3. Open Question (Not Yet Resolved — Needs Project Owner Decision)

The official PDF (§B1) lists top navigation as *"Employees, Contracts, Attendance, Time Off, Payroll, and **Reports**"* — a separate "Reports" item. The official mockup images, however, show only five top-nav items (`Employees | Contracts | Attendance | Time Off | Payroll`) with the Payroll Dashboard nested **inside** the Payroll dropdown (`Dashboard | Payruns | Payslips | Structures | Rules`), and no standalone "Reports" tab anywhere.

`20-FRONTEND-ARCHITECTURE.md` / `21-UI-UX-GUIDELINES.md` currently follow the **image-based** nav (no separate "Reports" item, Dashboard nested under Payroll) — this was not changed during this audit because the images are more concrete/recent than the PDF's prose wording, and re-architecting the whole nav on a one-word discrepancy risked overcorrecting. **This is flagged, not silently decided — confirm with the project owner before Phase 14 (Frontend Foundation) locks in the nav structure**, or default to the image-based structure if no response is available before that phase starts.

## 4. Backend Progress (`22-BACKEND-TODO.md`)

| Phase | Status |
|---|---|
| 1 — Backend Foundation | Complete — All 13 tasks complete |
| 2 — Authentication & RBAC | Complete — All 14 tasks complete |
| 3 — Employee Master Data | Complete — All 7 tasks complete |
| 4 — Working Schedules | Complete — All 4 tasks complete |
| 5 — Contracts | Complete — All 4 tasks complete |
| 6 — Attendance | Complete — All 4 tasks complete |
| 7 — Time Off | Complete — All 6 tasks complete |
| 8 — Salary Structures & Rules | Complete — All 5 tasks complete |
| 9 — Formula Engine | Complete — All 4 tasks complete |
| 10 — Payroll Processing | Complete — All 7 tasks complete |
| 11 — Payslip PDF & Email | Complete — All 5 tasks complete |
| 12 — Dashboard & Reporting | Complete — All 3 tasks complete |
| 13 — Seed Data & Backend Hardening | Complete — All 5 tasks complete: `utils/seed.js` and `npm run seed` verified; full representative dataset (10 employees, contracts, rules, 440 attendance logs, 3 payruns, 30 payslips); RBAC route matrix verified across all 5 roles; zero `passwordHash` response leaks; environment files audited |

**Backend Status:** 100% COMPLETE (All 82 backend TODO items checked off).

## 5. Frontend Progress (`23-FRONTEND-TODO.md`)

**Next unchecked task:** Phase 14 (Frontend Foundation), first item — Create/verify clean Vite React app setup and design tokens per `20-FRONTEND-ARCHITECTURE.md`.

## 6. Testing Progress (`24-TESTING-PLAN.md`)

- Phase 1 & Phase 2 Auth tests passing (health check, 404 response, requireAuth, requireRole union, bootstrap login, session persistence, logout revocation).

## 7. Known Environment Notes

- MongoDB: local only, `mongodb://127.0.0.1:27017/peoplepay360_db`. No cloud services required or configured.
- Bootstrap Admin seeded:
  - Email: `admin@peoplepay360.local`
  - Password: `AdminPassword2026!`
  - Roles: `["Admin"]`
- Public signup route has been permanently removed per `09-AUTHENTICATION-AND-USER-MANAGEMENT.md` §1.

## 8. How to Update This File

After finishing a meaningful chunk of work:
1. Update the relevant phase's status in §4/§5/§6 (`Not started` → `In progress` → `Complete`, with a one-line note on what was done/tested).
2. Update "Next unchecked task" in §4.
3. If any architectural decision changed, note it here **and** update the authoritative doc it affects — do not let this file become the only place a decision is recorded.
4. If the open question in §3 gets resolved, remove it from here and record the resolution in `20-FRONTEND-ARCHITECTURE.md`/`21-UI-UX-GUIDELINES.md` instead.
