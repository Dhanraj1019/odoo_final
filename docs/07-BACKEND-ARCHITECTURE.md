# 07 — Backend Architecture

## 1. Folder Structure (Full Detail)

```
backend/
├── src/
│   ├── config/
│   │   ├── db.js               # mongoose.connect()
│   │   ├── passport.js         # LocalStrategy setup, serialize/deserialize
│   │   └── session.js          # express-session + connect-mongo config
│   ├── models/
│   │   ├── User.js
│   │   ├── Employee.js
│   │   ├── Department.js
│   │   ├── JobPosition.js
│   │   ├── Contract.js
│   │   ├── WorkingSchedule.js
│   │   ├── Attendance.js
│   │   ├── TimeOffType.js
│   │   ├── TimeOffAllocation.js
│   │   ├── TimeOffRequest.js
│   │   ├── SalaryStructure.js
│   │   ├── SalaryRule.js
│   │   ├── Payrun.js
│   │   └── Payslip.js
│   ├── middleware/
│   │   ├── requireAuth.js
│   │   ├── requireRole.js
│   │   ├── errorHandler.js
│   │   └── validate.js         # lightweight request-body validators
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── users.controller.js
│   │   ├── employees.controller.js
│   │   ├── contracts.controller.js
│   │   ├── workingSchedules.controller.js
│   │   ├── attendance.controller.js
│   │   ├── timeOffTypes.controller.js
│   │   ├── timeOffAllocations.controller.js
│   │   ├── timeOffRequests.controller.js
│   │   ├── salaryStructures.controller.js
│   │   ├── salaryRules.controller.js
│   │   ├── payruns.controller.js
│   │   ├── payslips.controller.js
│   │   └── dashboard.controller.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── contract.service.js       # active-contract resolution, overlap checks
│   │   ├── attendance.service.js     # status derivation, worked-hours calc
│   │   ├── timeOff.service.js        # allocation deduction logic
│   │   ├── formulaEngine.service.js  # safe expression parser/evaluator
│   │   ├── payrollCompute.service.js # orchestrates payslip computation
│   │   ├── pdf.service.js            # PDFKit payslip generation
│   │   ├── mailer.service.js         # Nodemailer wrapper
│   │   └── dashboard.service.js      # aggregation pipelines
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── users.routes.js
│   │   ├── employees.routes.js
│   │   ├── contracts.routes.js
│   │   ├── workingSchedules.routes.js
│   │   ├── attendance.routes.js
│   │   ├── timeOffTypes.routes.js
│   │   ├── timeOffAllocations.routes.js
│   │   ├── timeOffRequests.routes.js
│   │   ├── salaryStructures.routes.js
│   │   ├── salaryRules.routes.js
│   │   ├── payruns.routes.js
│   │   ├── payslips.routes.js
│   │   ├── dashboard.routes.js
│   │   └── index.js             # mounts all routers under /api
│   ├── utils/
│   │   ├── apiResponse.js       # success()/error() helpers
│   │   ├── asyncHandler.js      # wraps async controllers
│   │   └── seed.js              # demo data seeding script
│   └── app.js                    # express() instance, middleware wiring
├── server.js                     # http.createServer(app), db connect, listen
├── .env
├── .env.example
└── package.json
```

## 2. Layering Rules (Strict)

- **Routes** — only map HTTP verb+path to a controller + middleware chain. No logic.
- **Controllers** — parse `req`, call one or more service functions, shape the response via `apiResponse`. No direct Mongoose queries for anything beyond a trivial single lookup.
- **Services** — all business logic (contract resolution, formula evaluation, payroll computation, dashboard aggregation). Services can call other services. Services throw typed errors (e.g., `{ statusCode, message }`) caught by `errorHandler`.
- **Models** — schema + schema-level validation + instance/static helper methods only (e.g., `WorkingSchedule.pre('save')` hook for computed hours).

This layering keeps each file small enough for an AI agent to load and reason about in isolation.

## 3. `app.js` Middleware Order (Critical)

```js
1. cors({ origin: process.env.CLIENT_ORIGIN, credentials: true })
2. express.json()
3. express.urlencoded({ extended: true })
4. method-override
5. session middleware (express-session + connect-mongo)
6. passport.initialize()
7. passport.session()
8. routes (mounted at /api)
9. 404 handler
10. errorHandler (must be last)
```

## 4. Authentication Wiring Summary

See `09-AUTHENTICATION-AND-USER-MANAGEMENT.md` for full detail. Summary:

- `passport-local` strategy verifies email + bcrypt-compared password against `User`.
- `passport.serializeUser` stores `user._id` in session.
- `passport.deserializeUser` loads the full `User` document (minus `passwordHash`) onto `req.user` on every request.
- `express-session` uses `connect-mongo` to persist sessions in the `sessions` collection of the same MongoDB database.

## 5. Standard Controller Pattern

```js
// employees.controller.js
const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/apiResponse");
const employeeService = require("../services/employee.service");

exports.listEmployees = asyncHandler(async (req, res) => {
  const employees = await employeeService.list(req.query);
  return success(res, employees);
});

exports.createEmployee = asyncHandler(async (req, res) => {
  const employee = await employeeService.create(req.body);
  return success(res, employee, 201);
});
```

## 6. Error Handling Pattern

```js
// utils/asyncHandler.js
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// middleware/errorHandler.js
module.exports = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack })
  });
};
```

## 7. Response Envelope

All API responses use this shape (see `08-API-CONTRACTS.md` for full contract):

```json
{ "success": true, "data": { }, "message": "optional" }
{ "success": false, "message": "Human readable error", "errors": [ ] }
```

## 8. Preserving Existing Code

During refactor: keep the existing Passport/session/Mongoose wiring logic where it already matches this architecture — only rename files/folders and relocate logic into the `services/` layer where it was previously inline in controllers or routes. Do not rewrite working authentication logic from scratch; adapt it.
