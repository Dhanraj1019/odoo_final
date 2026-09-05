# 00 — Project Overview

## 1. What This Project Is

**PeoplePay360** is an integrated **HR & Payroll Operations Platform**, built for the Odoo Hackathon 2026 problem statement titled *"PeoplePay360: HR & Payroll — An Integrated Human Resource and Payroll Operations Platform."*

It is not a set of disconnected CRUD screens. The **Employee record is the central hub**, and the following modules connect to it as a single operational flow:

- Employee master data (profile, department, manager, schedule, status)
- Contracts (historical, period-based)
- Working Schedules (weekly time patterns)
- Attendance (check-in/out, worked hours, corrections)
- Time Off (types, allocations, requests, approvals)
- Salary Structures & Salary Rules (configurable payroll computation)
- Payroll (Payruns → Payslips → PDF → Email)
- Payroll Dashboard (live, aggregated HR + Payroll analytics)

This is currently a **documentation-only phase**. No application code is to be written until this full documentation set is approved and referenced by an implementing AI agent or developer.

## 2. Source of Truth

The **primary source of truth** for all requirements is:

1. The official Hackathon Problem Statement (`01-HACKATHON-REQUIREMENTS.md` mirrors its content).
2. The official workflow/mockup screen images (`02-OFFICIAL-WORKFLOW.md` documents every screen and flow shown).

Any requirement not explicitly present in those materials is labeled in this documentation as either:

- **Assumption** — a reasonable default filling a genuine gap.
- **Recommended Implementation Decision** — a technical choice made to satisfy an official requirement using the confirmed tech stack (e.g., replacing "Python Code" formulas with a safe Node.js expression engine).

Nothing in this documentation set contradicts the official material. Where a technical translation was required (Node.js instead of Python for formulas), it is called out explicitly in `16-PAYROLL-FORMULA-ENGINE.md`.

## 3. Project Status

This is currently a **demo/blueprint project** being cleanly refactored. Existing code (React + Redux Toolkit + Express + Passport + MongoDB session auth) is preserved as a foundation but will be reorganized under clean, professional naming. The known folder typo `frontand` will be corrected to `frontend`.

## 4. Confirmed Decisions (Locked — Do Not Re-litigate)

These decisions were made and approved by the project owner. Future AI agents must **not** silently override them:

1. **No public signup.** Only Admins create users. See `09-AUTHENTICATION-AND-USER-MANAGEMENT.md`.
2. **Top navigation, not permanent sidebar.** See `21-UI-UX-GUIDELINES.md`.
3. **Multi-role users** (`roles: [Role]`), authorization by role-union. See `05-RBAC-ROLES-PERMISSIONS.md`.
4. **Session-based auth only** — Passport + express-session + connect-mongo. No JWT.
5. **No `eval()`, no `new Function()`, no arbitrary code execution** anywhere, especially in the payroll formula engine.
6. **Local MongoDB only** — `mongodb://127.0.0.1:27017/peoplepay360_db`. No cloud services.
7. **PDFKit** for Payslip PDFs, **Nodemailer** for email delivery, **Recharts** for dashboard charts. All must be documented as dependencies to install — do not assume they exist in the current codebase.
8. **Backend-first development.** No major frontend work begins until backend modules are designed and functional.

## 5. How This Documentation Set Works

This is a 27-file **persistent AI context system**. It exists so that if one AI coding session runs out of context, another session (or model) can resume work correctly by reading:

1. `00-PROJECT-OVERVIEW.md` (this file) — orientation.
2. `25-CURRENT-PROGRESS.md` — what's done, what's next.
3. The relevant module doc(s) for the task at hand.
4. `22-BACKEND-TODO.md` or `23-FRONTEND-TODO.md` — the exact next unchecked task.
5. `26-AI-HANDOFF.md` — the operating rules for how to pick up work.

See `26-AI-HANDOFF.md` for the mandatory step-by-step resumption protocol.

## 6. Full File Index

| # | File | Purpose |
|---|---|---|
| 00 | PROJECT-OVERVIEW | This file — orientation |
| 01 | HACKATHON-REQUIREMENTS | Verbatim-faithful restatement of the official problem statement |
| 02 | OFFICIAL-WORKFLOW | Screen-by-screen breakdown of the official mockup images |
| 03 | SYSTEM-ARCHITECTURE | High-level architecture, folder structure |
| 04 | TECH-STACK | Confirmed technologies, versions, and required new dependencies |
| 05 | RBAC-ROLES-PERMISSIONS | Full permission matrix, multi-role logic |
| 06 | DATABASE-DESIGN | MongoDB collections and Mongoose schemas |
| 07 | BACKEND-ARCHITECTURE | Express app structure, middleware, layering |
| 08 | API-CONTRACTS | REST endpoint specifications |
| 09 | AUTHENTICATION-AND-USER-MANAGEMENT | Session auth flow, Admin-only user creation |
| 10 | EMPLOYEE-MANAGEMENT | Employee module spec |
| 11 | CONTRACT-MANAGEMENT | Contract module spec |
| 12 | WORKING-SCHEDULE | Working Schedule module spec |
| 13 | ATTENDANCE-MANAGEMENT | Attendance module spec |
| 14 | TIME-OFF-MANAGEMENT | Time Off Types, Allocations, Requests |
| 15 | PAYROLL-ARCHITECTURE | Payrun/Payslip data flow and lifecycle |
| 16 | PAYROLL-FORMULA-ENGINE | Safe expression engine specification |
| 17 | APPROVAL-WORKFLOWS | Time Off and Payroll status-gated workflows |
| 18 | PAYSLIP-PDF-AND-EMAIL-DELIVERY | PDFKit + Nodemailer specification |
| 19 | PAYROLL-DASHBOARD-AND-REPORTING | Dashboard KPIs, charts, aggregation queries |
| 20 | FRONTEND-ARCHITECTURE | React app structure, state management |
| 21 | UI-UX-GUIDELINES | Visual design system, navigation pattern |
| 22 | BACKEND-TODO | Sequential backend implementation checklist |
| 23 | FRONTEND-TODO | Sequential frontend implementation checklist |
| 24 | TESTING-PLAN | Manual + automated test strategy |
| 25 | CURRENT-PROGRESS | Live project status tracker |
| 26 | AI-HANDOFF | Resumption protocol for AI coding agents |

## 7. Project Name

**PeoplePay360** — chosen to reflect a 360° connected view of HR and Payroll operations.
