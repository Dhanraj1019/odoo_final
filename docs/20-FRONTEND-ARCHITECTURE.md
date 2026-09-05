# 20 — Frontend Architecture

## 1. Folder Structure

```
frontend/                          ← renamed from "frontand"
├── src/
│   ├── app/
│   │   ├── store.js               # configureStore, combines all feature slices
│   │   └── router.jsx             # createBrowserRouter tree
│   ├── features/
│   │   ├── auth/
│   │   │   ├── authSlice.js
│   │   │   ├── authApi.js         # fetch wrapper calls to /api/auth
│   │   │   └── components/ (LoginForm, ...)
│   │   ├── users/                 # Admin user management
│   │   ├── employees/
│   │   ├── departments/
│   │   ├── contracts/
│   │   ├── workingSchedules/
│   │   ├── attendance/
│   │   ├── timeOff/
│   │   │   ├── types/
│   │   │   ├── allocations/
│   │   │   └── requests/
│   │   ├── payroll/
│   │   │   ├── structures/
│   │   │   ├── rules/
│   │   │   ├── payruns/
│   │   │   └── payslips/
│   │   ├── dashboard/
│   │   └── notifications/          # preserved from existing project
│   ├── components/                 # shared/reusable, feature-agnostic
│   │   ├── layout/ (TopNav, AppHeader, PageContainer)
│   │   ├── table/ (DataTable, StatusBadge)
│   │   ├── form/ (FormField, FormSelect, FormDatePicker)
│   │   └── feedback/ (Spinner, EmptyState, ConfirmDialog)
│   ├── layouts/
│   │   ├── AppLayout.jsx           # top nav + header + <Outlet/>
│   │   └── AuthLayout.jsx          # centered card, used only by Login
│   ├── routes/
│   │   ├── RequireAuth.jsx
│   │   └── RequireRole.jsx
│   ├── lib/
│   │   ├── apiClient.js            # fetch wrapper, base URL, credentials: 'include'
│   │   ├── constants.js            # ROLES enum, STATUS enums
│   │   └── formatters.js           # date/currency formatting
│   ├── index.css                   # Tailwind entry
│   └── main.jsx
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

## 2. State Management Strategy

- **Redux Toolkit** for: `auth` (current user/session), `notifications` (preserved from existing project).
- **RTK Query** (part of Redux Toolkit) is the **Recommended Implementation Decision** for all server-state (Employees, Contracts, Attendance, Time Off, Payroll, Dashboard) instead of hand-rolled thunks + local component state — it gives caching, invalidation, and loading states for free and matches "Redux Toolkit" already being in the confirmed stack. Each feature folder gets an `xApi.js` using `createApi` with `fetchBaseQuery({ baseUrl: '/api', credentials: 'include' })`.
- Local component state (`useState`) for pure UI state (modal open/closed, active tab, wizard step).

## 3. Routing (React Router DOM v7)

```
/login                              (AuthLayout, public)
/                                   (AppLayout, RequireAuth)
  /dashboard
  /employees                       (RequireRole: HR Manager+)
  /employees/:id
  /me                               (Employee self-service landing page)
  /contracts                       (RequireRole: HR Manager+)
  /working-schedules               (RequireRole: HR Manager+)
  /attendance                      (RequireAuth — content scoped by role inside)
  /time-off/requests
  /time-off/types                  (RequireRole: HR Manager+)
  /time-off/allocations            (RequireRole: HR Manager+)
  /payroll/structures              (RequireRole: HR Payroll User+, read for User, write for Manager+)
  /payroll/rules                   (same)
  /payroll/payruns                 (RequireRole: HR Payroll User+)
  /payroll/payruns/:id
  /payroll/payruns/new             (2-step wizard)
  /payroll/payslips                (RequireRole: HR Payroll User+; Employee sees /me/payslips instead)
  /admin/users                     (RequireRole: Admin)
```

## 4. Route Guard Pattern

```jsx
function RequireAuth({ children }) {
  const { user, status } = useSelector(s => s.auth);
  if (status === "loading") return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RequireRole({ allowed, children }) {
  const { user } = useSelector(s => s.auth);
  const authorized = user?.roles?.some(r => allowed.includes(r));
  if (!authorized) return <Navigate to="/" replace />;
  return children;
}
```

## 5. Role-Based Navigation Rendering

The top navigation (see `21-UI-UX-GUIDELINES.md`) renders module links conditionally based on `user.roles`, using the same allowed-roles arrays defined in `05-RBAC-ROLES-PERMISSIONS.md` §4 — kept in one shared `lib/constants.js` export (`NAV_PERMISSIONS`) so backend and frontend role lists never drift apart conceptually (they're necessarily separate files across two codebases, but should be reviewed together whenever one changes).

## 6. Forms (React Hook Form)

Every create/edit form uses `useForm` + a lightweight resolver (native RHF validation rules are sufficient for hackathon scope — no need to add a schema library like Zod/Yup unless the team already has one; if adding one, document it here first). Pattern:

```jsx
const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues });
const [createEmployee, { isLoading }] = useCreateEmployeeMutation();
const onSubmit = (data) => createEmployee(data).unwrap().then(() => navigate("/employees"));
```

## 7. API Client (Fetch Wrapper)

```js
// lib/apiClient.js
export async function apiFetch(path, options = {}) {
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.message || "Request failed");
  return body;
}
```
RTK Query's `fetchBaseQuery` is configured with the same base URL/credentials and is the primary consumer of this pattern; `apiClient.js` remains available for one-off calls outside RTK Query (e.g., file download/PDF streaming).

## 8. Preserving Existing Redux Slices

The existing `auth` and `notifications` slices are preserved and adapted (renamed fields if needed to match the new `User.roles` array shape) rather than rewritten from scratch.

## 9. Component Reuse Principles

- One `DataTable` component parameterized by column config, used by every List view (Employees, Contracts, Attendance, Time Off, Payslips, etc.) — avoid building a bespoke table per module.
- One `StatusBadge` component with a color map keyed by known status strings across all modules (Draft/Active/Approved/Refused/Paid/etc.).
- One `RelatedRecordsTabs` component (see `10-EMPLOYEE-MANAGEMENT.md` §6) reused wherever a parent-to-child navigation pattern is needed.
