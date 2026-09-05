const asyncHandler = require("../utils/asyncHandler");
const { success, error } = require("../utils/apiResponse");
const timeOffService = require("../services/timeOff.service");

/**
 * GET /api/time-off-types
 */
exports.listTimeOffTypes = asyncHandler(async (req, res) => {
  const timeOffTypes = await timeOffService.listTypes(req.query);
  return success(res, { timeOffTypes });
});

/**
 * GET /api/time-off-types/:id
 */
exports.getTimeOffTypeById = asyncHandler(async (req, res) => {
  const timeOffType = await timeOffService.getTypeById(req.params.id);
  if (!timeOffType) {
    return error(res, "Time off type not found", 404);
  }
  return success(res, { timeOffType });
});

/**
 * POST /api/time-off-types
 */
exports.createTimeOffType = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return error(res, "Validation Error: name is required", 400);
  }

  const timeOffType = await timeOffService.createType(req.body);
  return success(res, { timeOffType }, 201, "Time off type created successfully");
});

/**
 * PUT /api/time-off-types/:id
 */
exports.updateTimeOffType = asyncHandler(async (req, res) => {
  const timeOffType = await timeOffService.updateType(req.params.id, req.body);
  return success(res, { timeOffType }, 200, "Time off type updated successfully");
});

/**
 * DELETE /api/time-off-types/:id
 */
exports.deleteTimeOffType = asyncHandler(async (req, res) => {
  await timeOffService.deleteType(req.params.id);
  return success(res, null, 200, "Time off type deleted successfully");
});
