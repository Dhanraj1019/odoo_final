# 09 — Authentication & User Management

## 1. Confirmed Decision: No Public Signup

The official workflow's HR Portal login screen states accounts are *"created by an administrator."* The final application:

- Exposes **only a Login screen** publicly.
- Has **no public registration route or page**.
- All account creation happens through the Admin-only **User Management** screen.

If the existing codebase has a working public signup implementation, it may be **temporarily preserved during refactor** (e.g., moved behind a feature flag or repurposed directly into the Admin "Create User" form logic) but **must not be reachable from the public app** in the final state. Track its removal/repurposing as an explicit task in `22-BACKEND-TODO.md`.

## 2. Session-Based Authentication (Locked)

Stack: `passport` + `passport-local` + `express-session` + `connect-mongo` + `bcryptjs`. No JWT.

### Login Flow
```
POST /api/auth/login { email, password }
  → passport.authenticate('local')
  → LocalStrategy: find User by email → bcrypt.compare(password, user.passwordHash)
  → on success: req.login(user) → passport.serializeUser stores user._id in session
  → session persisted to MongoDB via connect-mongo (sessions collection)
  → session cookie (httpOnly, sameSite: 'lax', secure: false in dev) returned to browser
```

### Session Persistence Flow
```
GET /api/auth/me
  → browser sends session cookie automatically (credentials: 'include' on frontend fetch)
  → express-session loads session from MongoDB
  → passport.deserializeUser loads full User doc (minus passwordHash) → req.user
  → controller returns req.user
```

### Logout Flow
```
POST /api/auth/logout
  → req.logout(callback)
  → req.session.destroy()
  → res.clearCookie('connect.sid')
```

### Passport Config Sketch (`config/passport.js`)
```js
passport.use(new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
  const user = await User.findOne({ email: email.toLowerCase(), isActive: true });
  if (!user) return done(null, false, { message: "Invalid credentials" });
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return done(null, false, { message: "Invalid credentials" });
  return done(null, user);
}));

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id).select("-passwordHash");
  done(null, user);
});
```

### Session Config Sketch (`config/session.js`)
```js
session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: {
    maxAge: Number(process.env.SESSION_COOKIE_MAX_AGE) || 86400000,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  }
})
```

## 3. Admin-Only User Management

### Create User Flow (matches official mockup)
1. Admin opens **User Management** → "Create User."
2. Form fields: Full Name, Email, Password (Admin sets an initial password — no email-invite flow required for the hackathon, **Assumption**), Roles (multi-select checklist of the 5 roles), optional link to an existing Employee record.
3. On submit: backend hashes the password with `bcryptjs` (`bcrypt.hash(password, 10)`), creates the `User` document with `createdBy: req.user._id`.
4. Users **cannot** self-register, self-assign roles, or elevate their own permissions — every write to `roles` on the `User` model must go through an Admin-guarded route.

### Edit / Deactivate User
- Admin can update `fullName`, `roles`, `employee` link, `isActive`.
- **Prefer deactivation (`isActive: false`) over hard delete** so historical audit trails (who approved what, who created which payrun) remain intact. A deactivated user cannot log in (`LocalStrategy` checks `isActive: true`).

### Password Reset
- Admin-triggered `PUT /api/users/:id/reset-password` sets a new hashed password directly (no email-token flow required — **Assumption**, acceptable for a hackathon demo). A self-service "Forgot password" link appears in the mockup's login screen but its backend flow (e.g., token-based email reset) is **not specified in the official material** and is treated as **out of scope / stretch goal**, not a blocking requirement.

## 4. Linking Users to Employees

- A `User` with role `Employee` (possibly combined with other roles) **should** have `employee` set, so `GET /api/employees/me` and self-service Attendance/Time Off actions can resolve `req.user.employee`.
- A `User` with only `Admin`/HR-management roles and no operational "self-service" need **may** have `employee` left unset (Assumption — the mockup doesn't clarify whether every login must map to an employee record; but any user who needs to check in/out or submit personal leave requests must have one).

## 5. Route Guard Middleware

```js
// middleware/requireAuth.js
module.exports = (req, res, next) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ success: false, message: "Not authenticated" });
  }
  next();
};
```

```js
// middleware/requireRole.js
module.exports = (allowedRoles) => (req, res, next) => {
  const roles = req.user?.roles || [];
  if (!roles.some(r => allowedRoles.includes(r))) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }
  next();
};
```

Applied as: `router.post("/", requireAuth, requireRole(["Admin"]), usersController.create)`.

## 6. Security Notes

- Passwords are **never** returned in any API response (`.select("-passwordHash")` on every `User` query).
- Session secret must come from `.env` (`SESSION_SECRET`), never hardcoded.
- CORS must be configured with `credentials: true` and an explicit `origin` (not `*`) since cookies are involved.
