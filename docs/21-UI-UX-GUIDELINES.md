# 21 — UI/UX Guidelines

## 1. Theme Directive (Locked)

**Do not use** the previous cyberpunk / hacker / terminal / gaming / flashy theme. Build a **modern, professional, enterprise ERP/HRMS UI** — clean, minimal, information-dense but readable, comparable in polish/organization to tools like Odoo, BambooHR, or similar business SaaS.

The dark wireframe styling of the official mockup images is **structural reference only** (screen layout, field placement, navigation grouping) — not a visual/color directive. Build the real product in a light, professional palette.

## 2. Navigation Pattern (Confirmed — Top Nav, Not Sidebar)

```
┌──────────────────────────────────────────────────────────────────┐
│  [Logo] PeoplePay360     Dashboard  Employees▾ Contracts▾ ...     │  ← Top App Header
│                                          [Notifications] [User▾]  │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│                        Page Content Area                          │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
```

- Primary desktop nav: a **top header bar** with module-level items, each expanding a dropdown for sub-pages (e.g., `Time Off ▾` → Requests / Types / Allocations).
- Active module/page is visually indicated (underline or filled pill).
- Role-based: only render modules the current user's roles permit (see `20-FRONTEND-ARCHITECTURE.md` §5).
- Mobile/responsive: collapse into a hamburger-triggered drawer menu, listing the same items vertically.

Example conceptual nav per role:
```
Admin:               Dashboard, Employees, Contracts, Attendance, Time Off, Payroll, Admin
HR Manager:           Dashboard, Employees, Contracts, Attendance, Time Off
HR Payroll User:       Dashboard, Employees, Contracts, Attendance, Time Off, Payroll
HR Payroll Manager:    Dashboard, Employees, Contracts, Attendance, Time Off, Payroll
Employee:              My Profile, My Attendance, My Time Off, (My Payslips)
```

## 3. Visual System

| Element | Guideline |
|---|---|
| Color palette | Neutral grays/whites for backgrounds and surfaces; a single confident brand accent color (e.g., indigo/blue) for primary actions and active nav states; semantic colors for status only (green=success/paid/approved, amber=pending/draft, red=error/refused/overdue, blue=informational) |
| Typography | One clean sans-serif (system font stack or Inter-style), clear hierarchy: page titles, section headers, table headers, body text |
| Density | Compact table rows, generous but not wasteful padding — this is a data-heavy business tool, not a marketing site |
| Cards | Used for KPIs and grouped form sections, subtle border/shadow, no heavy gradients |
| Icons | Material UI icon set, used sparingly (nav items, action buttons, status indicators) |
| Motion | Framer Motion for subtle transitions only (page fade-in, dropdown open/close, modal enter/exit) — never decorative animation that slows down data-entry workflows |

## 4. Core UI Patterns (Reused Across Modules)

- **List view**: search bar + filter chips/dropdowns at top, a `DataTable` below, pagination footer.
- **Form view**: a card-based form, grouped into logical sections, Save/Cancel actions fixed at the bottom or top-right.
- **Status badge**: small pill, colored per status, consistent across every module (see `20-FRONTEND-ARCHITECTURE.md` §9).
- **Smart-tabs / related records**: a horizontal tab bar under a record's header linking to child records with count badges (Employee → Contracts (2), Attendance (14), Time Off (3)).
- **Wizard**: used only for Payrun creation — a 2-step horizontal stepper indicator, Back/Continue navigation, no ability to skip ahead.
- **Approval actions**: inline Approve/Refuse buttons on list rows and on the detail form, both calling the same backend action.
- **Dashboard**: filter bar pinned at top, KPI cards in a responsive grid, charts below, alerts/overview panels in a secondary grid.

## 5. Role-Specific Landing Experience

- **Employee** lands on a simplified **My Profile / My Day** page: their own attendance check-in/out widget, their leave balance cards, a shortcut to submit a Time Off request, and (if implemented) a link to their own Paid payslips. They never see the full Employees list/kanban or any admin/payroll screen.
- **HR Manager** lands on the Dashboard (`scope=hr`) or the Employees list.
- **HR Payroll User / HR Payroll Manager / Admin** land on the full Dashboard.

## 6. Accessibility & Responsiveness Baseline

- All interactive elements keyboard-reachable; forms use proper `<label>` association (React Hook Form's `register` handles this naturally when paired with MUI/Tailwind form components).
- Layout responsive down to a reasonable tablet width; full mobile optimization is a stretch goal, not a hackathon-blocking requirement, but the top nav must at least collapse gracefully (§2).

## 7. What Not To Do

- No neon colors, glowing borders, monospace "hacker" fonts, or scanline/glitch effects.
- No permanent left sidebar as the primary navigation (secondary in-page tab bars are fine, e.g., within Time Off's sub-pages, but the app-level shell uses top nav).
- No unnecessary full-page loading spinners for small interactions — use inline/button-level loading states instead (React Hook Form's `isSubmitting` / RTK Query's `isLoading`).
