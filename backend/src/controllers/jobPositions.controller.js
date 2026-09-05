const asyncHandler = require("../utils/asyncHandler");
const { success, error } = require("../utils/apiResponse");
const JobPosition = require("../models/JobPosition");

exports.listJobPositions = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.department) {
    filter.department = req.query.department;
  }

  const jobPositions = await JobPosition.find(filter)
    .populate("department")
    .sort({ name: 1 });

  return success(res, { jobPositions });
});

exports.getJobPositionById = asyncHandler(async (req, res) => {
  const jobPosition = await JobPosition.findById(req.params.id).populate(
    "department"
  );
  if (!jobPosition) {
    return error(res, "Job position not found", 404);
  }
  return success(res, { jobPosition });
});

exports.createJobPosition = asyncHandler(async (req, res) => {
  const { name, department } = req.body;
  if (!name || !name.trim()) {
    return error(res, "Validation Error: Job position name is required", 400);
  }

  const existing = await JobPosition.findOne({ name: name.trim() });
  if (existing) {
    return error(res, "Job position with this name already exists", 409);
  }

  const jobPosition = new JobPosition({
    name: name.trim(),
    department: department || null,
  });

  await jobPosition.save();
  return success(res, { jobPosition }, 201, "Job position created successfully");
});

exports.updateJobPosition = asyncHandler(async (req, res) => {
  const { name, department } = req.body;
  if (!name || !name.trim()) {
    return error(res, "Validation Error: Job position name is required", 400);
  }

  const jobPosition = await JobPosition.findById(req.params.id);
  if (!jobPosition) {
    return error(res, "Job position not found", 404);
  }

  const duplicate = await JobPosition.findOne({
    name: name.trim(),
    _id: { $ne: req.params.id },
  });
  if (duplicate) {
    return error(res, "Job position with this name already exists", 409);
  }

  jobPosition.name = name.trim();
  if (department !== undefined) {
    jobPosition.department = department || null;
  }

  await jobPosition.save();
  return success(res, { jobPosition }, 200, "Job position updated successfully");
});

exports.deleteJobPosition = asyncHandler(async (req, res) => {
  const jobPosition = await JobPosition.findByIdAndDelete(req.params.id);
  if (!jobPosition) {
    return error(res, "Job position not found", 404);
  }
  return success(res, null, 200, "Job position deleted successfully");
});
