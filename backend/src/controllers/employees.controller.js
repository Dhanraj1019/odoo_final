const asyncHandler = require("../utils/asyncHandler");
const { success, error } = require("../utils/apiResponse");
const employeeService = require("../services/employee.service");

/**
 * GET /api/employees
 * Query: ?department=&status=&search=
 */
exports.listEmployees = asyncHandler(async (req, res) => {
  const employees = await employeeService.list(req.query);
  return success(res, { employees });
});

/**
 * GET /api/employees/me
 * Retrieves current authenticated user's linked Employee record
 */
exports.getMyEmployeeProfile = asyncHandler(async (req, res) => {
  if (!req.user) {
    return error(res, "Unauthorized", 401);
  }

  const employee = await employeeService.getEmployeeForUser(req.user);
  if (!employee) {
    return error(
      res,
      "No employee record is linked to this user account",
      404
    );
  }

  return success(res, { employee });
});

/**
 * GET /api/employees/:id
 */
exports.getEmployeeById = asyncHandler(async (req, res) => {
  const employee = await employeeService.getById(req.params.id);
  if (!employee) {
    return error(res, "Employee not found", 404);
  }
  return success(res, { employee });
});

/**
 * POST /api/employees
 */
exports.createEmployee = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!fullName || !email || !email.trim()) {
    return error(
      res,
      "Validation Error: fullName and email are required",
      400
    );
  }

  try {
    const employee = await employeeService.create(req.body, req.user?._id);
    return success(res, { employee }, 201, "Employee created successfully");
  } catch (err) {
    if (err.code === "EMPLOYEE_EMAIL_EXISTS" || err.code === "USER_EMAIL_EXISTS" || err.statusCode === 409) {
      return res.status(409).json({
        success: false,
        code: err.code || "EMAIL_CONFLICT",
        message: err.message || "Email address conflict occurred.",
        employee: err.employee || null,
        user: err.user || null,
      });
    }
    throw err;
  }
});

/**
 * PUT /api/employees/:id/password
 * Body: { newPassword }
 */
exports.updateEmployeePassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
    return error(
      res,
      "Validation Error: Password must be at least 8 characters",
      400
    );
  }

  const result = await employeeService.updatePassword(
    req.params.id,
    newPassword,
    req.user?._id
  );
  return success(res, result, 200, "Password updated successfully");
});

/**
 * PUT /api/employees/:id
 */
exports.updateEmployee = asyncHandler(async (req, res) => {
  const employee = await employeeService.update(req.params.id, req.body);
  return success(res, { employee }, 200, "Employee updated successfully");
});

/**
 * DELETE /api/employees/:id
 * Safely removes employee record after unlinking User accounts and verifying no operational conflicts
 */
exports.deleteEmployee = asyncHandler(async (req, res) => {
  const result = await employeeService.delete(req.params.id);
  return success(res, result, 200, "Employee deleted successfully.");
});

/**
 * GET /api/employees/lookup?email=
 * Accessible to Admin and HR roles for User Provisioning and Email Search
 */
exports.lookupEmployeeByEmail = asyncHandler(async (req, res) => {
  const { email } = req.query;
  if (!email || !email.trim()) {
    return error(res, "Validation Error: email query parameter is required", 400);
  }

  const result = await employeeService.lookupByEmail(email);
  return success(res, result, 200, "Employee lookup completed successfully");
});
