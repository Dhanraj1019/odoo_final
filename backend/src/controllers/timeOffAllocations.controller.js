const asyncHandler = require("../utils/asyncHandler");
const { success, error } = require("../utils/apiResponse");
const timeOffService = require("../services/timeOff.service");

/**
 * GET /api/time-off-allocations
 */
exports.listAllocations = asyncHandler(async (req, res) => {
  const allocations = await timeOffService.listAllocations(req.query, req.user);
  return success(res, { allocations });
});

/**
 * GET /api/time-off-allocations/:id
 */
exports.getAllocationById = asyncHandler(async (req, res) => {
  const allocation = await timeOffService.getAllocationById(req.params.id, req.user);
  if (!allocation) {
    return error(res, "Allocation not found", 404);
  }
  return success(res, { allocation });
});

/**
 * POST /api/time-off-allocations
 */
exports.createAllocation = asyncHandler(async (req, res) => {
  const { employee, timeOffType, allocatedAmount } = req.body;
  if (!employee || !timeOffType || allocatedAmount === undefined) {
    return error(
      res,
      "Validation Error: employee, timeOffType, and allocatedAmount are required",
      400
    );
  }

  const allocation = await timeOffService.createAllocation(req.body);
  return success(res, { allocation }, 201, "Allocation created successfully");
});

/**
 * PUT /api/time-off-allocations/:id/approve
 */
exports.approveAllocation = asyncHandler(async (req, res) => {
  const allocation = await timeOffService.approveAllocation(req.params.id);
  return success(res, { allocation }, 200, "Allocation approved successfully");
});

/**
 * PUT /api/time-off-allocations/:id
 */
exports.updateAllocation = asyncHandler(async (req, res) => {
  const allocation = await timeOffService.updateAllocation(req.params.id, req.body);
  return success(res, { allocation }, 200, "Allocation updated successfully");
});

/**
 * DELETE /api/time-off-allocations/:id
 */
exports.deleteAllocation = asyncHandler(async (req, res) => {
  await timeOffService.deleteAllocation(req.params.id);
  return success(res, null, 200, "Allocation deleted successfully");
});
