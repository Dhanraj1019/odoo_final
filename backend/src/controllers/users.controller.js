const asyncHandler = require("../utils/asyncHandler");
const { success, error } = require("../utils/apiResponse");
const userService = require("../services/user.service");

/**
 * GET /api/users
 * Query: ?search=&role=&status=
 */
exports.listUsers = asyncHandler(async (req, res) => {
  const users = await userService.listUsers(req.query);
  return success(res, { users });
});

/**
 * GET /api/users/:id
 */
exports.getUser = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  if (!user) {
    return error(res, "User not found", 404);
  }
  return success(res, { user });
});

/**
 * POST /api/users
 * Body: { employeeId?, fullName?, email?, password, roles }
 */
exports.createUser = asyncHandler(async (req, res) => {
  const { employeeId, fullName, email, password, roles } = req.body;

  if (!password || !roles) {
    return error(
      res,
      "Validation Error: password and roles are required",
      400
    );
  }

  if (!employeeId && (!fullName || !email)) {
    return error(
      res,
      "Validation Error: either employee selection or fullName and email are required",
      400
    );
  }

  const user = await userService.createUser(req.body, req.user?._id);
  return success(res, { user }, 201, "User created successfully");
});

/**
 * PUT /api/users/:id
 * Body: { fullName?, roles?, employeeId?, isActive? }
 */
exports.updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body);
  return success(res, { user }, 200, "User updated successfully");
});

/**
 * PUT /api/users/:id/reset-password
 * Body: { newPassword }
 */
exports.resetPassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) {
    return error(
      res,
      "Validation Error: newPassword must be at least 8 characters",
      400
    );
  }

  await userService.resetPassword(req.params.id, newPassword);
  return success(res, null, 200, "Password updated successfully");
});

/**
 * DELETE /api/users/:id
 * Soft deletes by setting isActive = false
 */
exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await userService.deactivateUser(req.params.id);
  return success(res, { user }, 200, "User deactivated successfully");
});

/**
 * GET /api/users/lookup?email=
 * Accessible to Admin and HR Manager for Employee Smart Linking
 */
exports.lookupUserByEmail = asyncHandler(async (req, res) => {
  const { email } = req.query;
  if (!email || !email.trim()) {
    return error(res, "Validation Error: email query parameter is required", 400);
  }

  const result = await userService.lookupByEmail(email);
  return success(res, result, 200, "User lookup completed successfully");
});
