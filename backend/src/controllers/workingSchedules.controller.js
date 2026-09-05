const asyncHandler = require("../utils/asyncHandler");
const { success, error } = require("../utils/apiResponse");
const WorkingSchedule = require("../models/WorkingSchedule");

/**
 * GET /api/working-schedules
 */
exports.listWorkingSchedules = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) {
    filter.status = req.query.status;
  }
  const schedules = await WorkingSchedule.find(filter).sort({ name: 1 });
  return success(res, { workingSchedules: schedules });
});

/**
 * GET /api/working-schedules/:id
 */
exports.getWorkingScheduleById = asyncHandler(async (req, res) => {
  const schedule = await WorkingSchedule.findById(req.params.id);
  if (!schedule) {
    return error(res, "Working schedule not found", 404);
  }
  return success(res, { workingSchedule: schedule });
});

/**
 * POST /api/working-schedules
 */
exports.createWorkingSchedule = asyncHandler(async (req, res) => {
  const { name, company, days, status } = req.body;
  if (!name || !name.trim()) {
    return error(res, "Validation Error: Schedule name is required", 400);
  }

  const existing = await WorkingSchedule.findOne({ name: name.trim() });
  if (existing) {
    return error(res, "A working schedule with this name already exists", 409);
  }

  const schedule = new WorkingSchedule({
    name: name.trim(),
    company: company || "My Company",
    days: Array.isArray(days) ? days : [],
    status: status || "Active",
  });

  await schedule.save();
  return success(res, { workingSchedule: schedule }, 201, "Working schedule created successfully");
});

/**
 * PUT /api/working-schedules/:id
 */
exports.updateWorkingSchedule = asyncHandler(async (req, res) => {
  const { name, company, days, status } = req.body;
  const schedule = await WorkingSchedule.findById(req.params.id);
  if (!schedule) {
    return error(res, "Working schedule not found", 404);
  }

  if (name && name.trim()) {
    const duplicate = await WorkingSchedule.findOne({
      name: name.trim(),
      _id: { $ne: req.params.id },
    });
    if (duplicate) {
      return error(res, "A working schedule with this name already exists", 409);
    }
    schedule.name = name.trim();
  }

  if (company !== undefined) schedule.company = company;
  if (days !== undefined) schedule.days = Array.isArray(days) ? days : [];
  if (status !== undefined) schedule.status = status;

  await schedule.save();
  return success(res, { workingSchedule: schedule }, 200, "Working schedule updated successfully");
});

/**
 * DELETE /api/working-schedules/:id
 */
exports.deleteWorkingSchedule = asyncHandler(async (req, res) => {
  const schedule = await WorkingSchedule.findById(req.params.id);
  if (!schedule) {
    return error(res, "Working schedule not found", 404);
  }

  schedule.status = "Archived";
  await schedule.save();
  return success(res, { workingSchedule: schedule }, 200, "Working schedule archived successfully");
});
