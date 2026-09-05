# 03 — System Architecture

## 1. Architecture Style

A classic **client-server monolith**, session-authenticated:

```
[React SPA (Vite)]  <-- fetch, credentials: 'include' -->  [Express API]  <-->  [MongoDB (local)]
                                                                  |
                                                          [connect-mongo session store]
```

- Frontend and backend are separate deployable units in the same repo (monorepo-style, two top-level folders).
- No microservices, no message queues, no cloud services — this is a hackathon-scoped, single-server deployment aimed at a local demo.
- Real-time updates are **not required**; the dashboard uses on-demand fetch/refresh, not websockets (Recommended Implementation Decision — simplicity over-engineering avoidance).

## 2. Top-Level Repository Structure

```
peoplepay360/
├── backend/
├── frontend/                  ← renamed from "frontand"
├── docs/                      ← this documentation set (00–26)
├── .gitignore
└── README.md
```

## 3. Backend High-Level Layers

```
backend/
├── src/
│   ├── config/          # env loading, db connection, passport config, session config
│   ├── models/          # Mongoose schemas
│   ├── middleware/       # auth guard, role guard, error handler, validation
│   ├── controllers/     # request handlers (thin, call services)
│   ├── services/        # business logic (contract selection, formula engine, payroll compute)
│   ├── routes/          # Express routers, one per resource
│   ├── utils/           # response helpers, formula parser, pdf generator, mailer
│   └── app.js           # Express app assembly
├── server.js            # entry point (http server + db connect)
├── .env.example
└── package.json
```

See `07-BACKEND-ARCHITECTURE.md` for full detail on each layer.

## 4. Frontend High-Level Layers

```
frontend/
├── src/
│   ├── app/              # store.js (Redux), router.jsx
│   ├── features/         # one folder per domain (auth, employees, contracts, attendance,
│   │                       timeOff, payroll, dashboard, admin) — slice + api + components
│   ├── components/       # shared/reusable UI (layout, table, badge, form controls)
│   ├── layouts/          # AppLayout (top nav + header), AuthLayout
│   ├── routes/           # route guards (RequireAuth, RequireRole)
│   ├── lib/              # fetch client wrapper, constants, formatters
│   └── main.jsx
├── index.html
├── vite.config.js
└── package.json
```

See `20-FRONTEND-ARCHITECTURE.md` for full detail.

## 5. Request Flow (Typical Read)

1. React component dispatches an RTK Query / thunk call → `fetch('/api/...', { credentials: 'include' })`.
2. Express receives request → session middleware attaches `req.user` via Passport deserialize.
3. `requireAuth` middleware checks session exists.
4. `requireRole([...])` middleware checks role intersection (see `05-RBAC-ROLES-PERMISSIONS.md`).
5. Controller calls a service function (business logic layer).
6. Service queries Mongoose models, applies business rules (e.g., "only the period-applicable contract").
7. Controller returns a consistent JSON envelope (see `08-API-CONTRACTS.md`).
8. Frontend slice updates Redux state; component re-renders.

## 6. Cross-Cutting Concerns

| Concern | Approach |
|---|---|
| Auth | Session cookie, Passport local strategy, MongoDB-backed session store |
| Authorization | Middleware-based role-union guard per route |
| Validation | Request-level validation in middleware/controllers (lightweight, no heavy library required — hand-rolled validators acceptable for hackathon scope) |
| Error handling | Centralized Express error-handling middleware → consistent error JSON shape |
| Logging | Console-based logging is sufficient for a hackathon; no external logging service |
| Formula safety | Dedicated formula engine module, no `eval`/`new Function` (see `16-PAYROLL-FORMULA-ENGINE.md`) |
| PDF generation | PDFKit, generated on-demand in a service, streamed or buffered to response |
| Email | Nodemailer, SMTP config via `.env`, never hardcoded |
| Dashboard aggregation | MongoDB aggregation pipelines computed on read; no separate caching layer needed at this scale |

## 7. Deployment Model

- **Local only.** No CI/CD, no cloud deployment configuration required for this hackathon.
- Backend runs on a Node port (e.g., `5000`); frontend dev server runs via Vite (e.g., `5173`) with a proxy to the backend during development, or served statically by Express in a simple "single origin" demo mode if time allows (Recommended Implementation Decision, not mandatory).

## 8. Non-Goals (Explicitly Out of Scope)

- Multi-tenant / multi-company support beyond a single `Company` reference field (the mockup shows a "Company" field but multi-company logic is not required — Assumption: single company for the hackathon demo).
- JWT-based auth.
- Real-time websocket dashboards.
- Cloud storage for PDFs (generate on-demand or store locally under `backend/generated/payslips/`).
- Horizontal scaling concerns.
