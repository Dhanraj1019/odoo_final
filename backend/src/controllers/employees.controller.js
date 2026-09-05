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
  const { fullName, employeeCode, email } = req.body;
  if (!fullName || !employeeCode || !email) {
    return error(
      res,
      "Validation Error: fullName, employeeCode, and email are required",
      400
    );
  }

  const employee = await employeeService.create(req.body);
  return success(res, { employee }, 201, "Employee created successfully");
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
 * Soft deletes employee (sets status = 'Terminated')
 */
exports.deleteEmployee = asyncHandler(async (req, res) => {
  const employee = await employeeService.delete(req.params.id);
  return success(res, { employee }, 200, "Employee terminated successfully");
});
