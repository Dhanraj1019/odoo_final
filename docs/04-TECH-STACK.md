# 04 — Tech Stack

This is the **confirmed, locked** technology stack. Do not substitute or add major frameworks without updating this file and getting explicit approval.

## 1. Frontend

| Technology | Purpose |
|---|---|
| React 19 | UI library |
| Vite | Build tool / dev server |
| React Router DOM v7 | Client-side routing |
| Redux Toolkit | Global state management |
| React Redux | React bindings for Redux |
| React Hook Form | Form state/validation |
| TailwindCSS v4 | Utility-first styling |
| Material UI (components/icons) | Used selectively for complex components (tables, date pickers, dialogs) where hand-rolled Tailwind would be slower to build |
| Motion / Framer Motion | Micro-interactions/transitions |
| Native Fetch API | HTTP client (no axios) |
| **Recharts** *(new — required)* | Dashboard charts (bar, line) |

## 2. Backend

| Technology | Purpose |
|---|---|
| Node.js v22 | Runtime |
| Express.js v5 | HTTP framework |
| MongoDB (local) | Database |
| Mongoose | ODM |
| Passport.js + passport-local | Authentication strategy |
| express-session | Session middleware |
| connect-mongo | MongoDB-backed session store |
| bcryptjs | Password hashing |
| cors | Cross-origin support (frontend dev server → backend) |
| dotenv | Environment variable loading |
| method-override | Support PUT/DELETE from clients that need it |
| **PDFKit** *(new — required)* | Payslip PDF generation |
| **Nodemailer** *(new — required)* | Payslip bulk email delivery |

## 3. Database

Local MongoDB only:

```
mongodb://127.0.0.1:27017/peoplepay360_db
```

No Atlas, no cloud database, no external DB services.

## 4. New Dependencies to Install

These are **not assumed to already be installed**. They must be added explicitly during Phase 1 (backend) and the relevant frontend phase:

Backend (`backend/package.json`):
```bash
npm install pdfkit nodemailer
```

Frontend (`frontend/package.json`):
```bash
npm install recharts
```

Do not assume `recharts`, `pdfkit`, or `nodemailer` exist in the current codebase — verify with `npm ls <package>` before use, and install if missing. Record the installation in `25-CURRENT-PROGRESS.md` once done.

## 5. Explicitly Rejected / Forbidden

| Rejected | Reason |
|---|---|
| JWT authentication | Session-based auth is the confirmed requirement |
| `eval()` / `new Function()` | Security — arbitrary code execution forbidden |
| Real Python execution (e.g., child_process to a Python interpreter) | Backend is Node.js; formula engine must be a native JS-safe interpreter (see `16-PAYROLL-FORMULA-ENGINE.md`) |
| Public self-signup | Official workflow requires Admin-created users only |
| Cloud services (S3, SES, Atlas, etc.) | Local-only hackathon scope |
| axios | Native Fetch API is the confirmed HTTP client |

## 6. Environment Variables (`.env` — backend)

```
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/peoplepay360_db
SESSION_SECRET=<generate-a-long-random-string>
SESSION_COOKIE_MAX_AGE=86400000

# Nodemailer / SMTP (never hardcode these)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM="PeoplePay360 <no-reply@peoplepay360.local>"

# Frontend origin for CORS
CLIENT_ORIGIN=http://localhost:5173
```

For a hackathon demo, SMTP can point at a throwaway service (e.g., Mailtrap/Ethereal test SMTP) — this is a **Recommended Implementation Decision**, not an official requirement, since the source material does not mandate a specific email provider.

## 7. Environment Variables (`.env` — frontend, if needed)

```
VITE_API_BASE_URL=http://localhost:5000/api
```
