const asyncHandler = require("../utils/asyncHandler");
const { success, error } = require("../utils/apiResponse");
const attendanceService = require("../services/attendance.service");

/**
 * POST /api/attendance/check-in
 * Employee self check-in
 */
exports.checkIn = asyncHandler(async (req, res) => {
  const employeeId = req.user.employee;
  if (!employeeId) {
    return error(res, "No linked Employee profile found for your account", 400);
  }

  const attendance = await attendanceService.checkIn(employeeId);
  return success(res, { attendance }, 200, "Checked in successfully");
});

/**
 * POST /api/attendance/check-out
 * Employee self check-out
 */
exports.checkOut = asyncHandler(async (req, res) => {
  const employeeId = req.user.employee;
  if (!employeeId) {
    return error(res, "No linked Employee profile found for your account", 400);
  }

  const attendance = await attendanceService.checkOut(employeeId);
  return success(res, { attendance }, 200, "Checked out successfully");
});

/**
 * GET /api/attendance
 * Query: ?employee=&from=&to=&status=
 */
exports.listAttendances = asyncHandler(async (req, res) => {
  const attendances = await attendanceService.list(req.query, req.user);
  return success(res, { attendances });
});

/**
 * GET /api/attendance/:id
 */
exports.getAttendanceById = asyncHandler(async (req, res) => {
  const attendance = await attendanceService.getById(req.params.id, req.user);
  if (!attendance) {
    return error(res, "Attendance record not found", 404);
  }
  return success(res, { attendance });
});

/**
 * POST /api/attendance
 * HR / Admin manual creation
 */
exports.createAttendance = asyncHandler(async (req, res) => {
  const { employee, date } = req.body;
  if (!employee || !date) {
    return error(res, "Validation Error: employee and date are required", 400);
  }

  const attendance = await attendanceService.createManual(req.body, req.user._id);
  return success(res, { attendance }, 201, "Attendance record created successfully");
});

/**
 * PUT /api/attendance/:id
 * HR / Admin manual update
 */
exports.updateAttendance = asyncHandler(async (req, res) => {
  const attendance = await attendanceService.updateManual(
    req.params.id,
    req.body,
    req.user._id
  );
  return success(res, { attendance }, 200, "Attendance record updated successfully");
});

/**
 * DELETE /api/attendance/:id
 */
exports.deleteAttendance = asyncHandler(async (req, res) => {
  await attendanceService.delete(req.params.id);
  return success(res, null, 200, "Attendance record deleted successfully");
});
