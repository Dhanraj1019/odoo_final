const express = require("express");
const cors = require("cors");
const methodOverride = require("method-override");
const passport = require("passport");
const errorHandler = require("./middleware/errorHandler");
const { success, error } = require("./utils/apiResponse");

// Initialize Passport strategies
require("./config/passport");

const app = express();

// 1. CORS
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

// 2. express.json()
app.use(express.json());

// 3. express.urlencoded()
app.use(express.urlencoded({ extended: true }));

// 4. method-override
app.use(methodOverride("_method"));

// 5. session middleware (express-session + connect-mongo)
const sessionMiddleware = require("./config/session");
app.use(sessionMiddleware);

// 6. passport.initialize()
app.use(passport.initialize());

// 7. passport.session()
app.use(passport.session());

// /health route returning { success: true }
app.get("/health", (req, res) => {
  return success(
    res,
    { status: "ok", timestamp: new Date().toISOString() },
    200,
    "Service is healthy"
  );
});

// 8. routes (mounted at /api)
const authRoutes = require("./routes/auth.routes");
const usersRoutes = require("./routes/users.routes");
const departmentsRoutes = require("./routes/departments.routes");
const jobPositionsRoutes = require("./routes/jobPositions.routes");
const employeesRoutes = require("./routes/employees.routes");
const workingSchedulesRoutes = require("./routes/workingSchedules.routes");
const contractsRoutes = require("./routes/contracts.routes");
const attendanceRoutes = require("./routes/attendance.routes");
const timeOffTypesRoutes = require("./routes/timeOffTypes.routes");
const timeOffAllocationsRoutes = require("./routes/timeOffAllocations.routes");
const timeOffRequestsRoutes = require("./routes/timeOffRequests.routes");
const salaryRulesRoutes = require("./routes/salaryRules.routes");
const salaryStructuresRoutes = require("./routes/salaryStructures.routes");
const payrunsRoutes = require("./routes/payruns.routes");
const payslipsRoutes = require("./routes/payslips.routes");
const dashboardRoutes = require("./routes/dashboard.routes");

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/departments", departmentsRoutes);
app.use("/api/job-positions", jobPositionsRoutes);
app.use("/api/employees", employeesRoutes);
app.use("/api/working-schedules", workingSchedulesRoutes);
app.use("/api/contracts", contractsRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/time-off-types", timeOffTypesRoutes);
app.use("/api/time-off-allocations", timeOffAllocationsRoutes);
app.use("/api/time-off-requests", timeOffRequestsRoutes);
app.use("/api/salary-rules", salaryRulesRoutes);
app.use("/api/salary-structures", salaryStructuresRoutes);
app.use("/api/payruns", payrunsRoutes);
app.use("/api/payslips", payslipsRoutes);
app.use("/api/dashboard", dashboardRoutes);

// 9. 404 handler
app.use((req, res, next) => {
  return error(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
});

// 10. errorHandler (must be last)
app.use(errorHandler);

module.exports = app;
