const asyncHandler = require("../utils/asyncHandler");
const { success, error } = require("../utils/apiResponse");
const timeOffService = require("../services/timeOff.service");

/**
 * GET /api/time-off-requests
 */
exports.listRequests = asyncHandler(async (req, res) => {
  const requests = await timeOffService.listRequests(req.query, req.user);
  return success(res, { requests });
});

/**
 * GET /api/time-off-requests/calculate-duration
 */
exports.calculateDuration = asyncHandler(async (req, res) => {
  const { employee, startDate, endDate, unit } = req.query;
  if (!startDate || !endDate) {
    return error(res, "startDate and endDate are required", 400);
  }
  const employeeId =
    employee ||
    (req.user?.employee ? req.user.employee._id || req.user.employee : null);

  const duration = await timeOffService.calculateDuration(
    employeeId,
    startDate,
    endDate,
    unit || "Days"
  );
  return success(res, { duration });
});

/**
 * GET /api/time-off-requests/:id
 */
exports.getRequestById = asyncHandler(async (req, res) => {
  const request = await timeOffService.getRequestById(req.params.id, req.user);
  if (!request) {
    return error(res, "Time off request not found", 404);
  }
  return success(res, { request });
});

/**
 * POST /api/time-off-requests
 */
exports.createRequest = asyncHandler(async (req, res) => {
  const { timeOffType, startDate, endDate } = req.body;
  if (!timeOffType || !startDate || !endDate) {
    return error(
      res,
      "Validation Error: timeOffType, startDate, and endDate are required",
      400
    );
  }

  const request = await timeOffService.createRequest(req.body, req.user);
  return success(res, { request }, 201, "Time off request submitted successfully");
});

/**
 * PUT /api/time-off-requests/:id/approve
 */
exports.approveRequest = asyncHandler(async (req, res) => {
  const request = await timeOffService.approveRequest(req.params.id, req.user);
  return success(res, { request }, 200, "Time off request approved successfully");
});

/**
 * PUT /api/time-off-requests/:id/refuse
 */
exports.refuseRequest = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const request = await timeOffService.refuseRequest(req.params.id, req.user, reason);
  return success(res, { request }, 200, "Time off request refused successfully");
});

/**
 * DELETE /api/time-off-requests/:id
 */
exports.deleteRequest = asyncHandler(async (req, res) => {
  await timeOffService.deleteRequest(req.params.id, req.user);
  return success(res, null, 200, "Time off request deleted successfully");
});
