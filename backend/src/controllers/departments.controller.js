const asyncHandler = require("../utils/asyncHandler");
const { success, error } = require("../utils/apiResponse");
const Department = require("../models/Department");

exports.listDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.find().sort({ name: 1 });
  return success(res, { departments });
});

exports.getDepartmentById = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);
  if (!department) {
    return error(res, "Department not found", 404);
  }
  return success(res, { department });
});

exports.createDepartment = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return error(res, "Validation Error: Department name is required", 400);
  }

  const existing = await Department.findOne({ name: name.trim() });
  if (existing) {
    return error(res, "Department with this name already exists", 409);
  }

  const department = new Department({ name: name.trim() });
  await department.save();
  return success(res, { department }, 201, "Department created successfully");
});

exports.updateDepartment = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return error(res, "Validation Error: Department name is required", 400);
  }

  const department = await Department.findById(req.params.id);
  if (!department) {
    return error(res, "Department not found", 404);
  }

  const duplicate = await Department.findOne({
    name: name.trim(),
    _id: { $ne: req.params.id },
  });
  if (duplicate) {
    return error(res, "Department with this name already exists", 409);
  }

  department.name = name.trim();
  await department.save();
  return success(res, { department }, 200, "Department updated successfully");
});

exports.deleteDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findByIdAndDelete(req.params.id);
  if (!department) {
    return error(res, "Department not found", 404);
  }
  return success(res, null, 200, "Department deleted successfully");
});
