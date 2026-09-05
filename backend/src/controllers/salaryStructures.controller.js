const asyncHandler = require("../utils/asyncHandler");
const { success, error } = require("../utils/apiResponse");
const salaryStructureService = require("../services/salaryStructure.service");

/**
 * GET /api/salary-structures
 */
exports.listSalaryStructures = asyncHandler(async (req, res) => {
  const salaryStructures = await salaryStructureService.list(req.query);
  return success(res, { salaryStructures });
});

/**
 * GET /api/salary-structures/:id
 */
exports.getSalaryStructureById = asyncHandler(async (req, res) => {
  const salaryStructure = await salaryStructureService.getById(req.params.id);
  if (!salaryStructure) {
    return error(res, "Salary structure not found", 404);
  }
  return success(res, { salaryStructure });
});

/**
 * POST /api/salary-structures
 */
exports.createSalaryStructure = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return error(res, "Validation Error: name is required", 400);
  }

  const salaryStructure = await salaryStructureService.create(req.body);
  return success(res, { salaryStructure }, 201, "Salary structure created successfully");
});

/**
 * PUT /api/salary-structures/:id
 */
exports.updateSalaryStructure = asyncHandler(async (req, res) => {
  const salaryStructure = await salaryStructureService.update(req.params.id, req.body);
  return success(res, { salaryStructure }, 200, "Salary structure updated successfully");
});

/**
 * DELETE /api/salary-structures/:id
 */
exports.deleteSalaryStructure = asyncHandler(async (req, res) => {
  await salaryStructureService.delete(req.params.id);
  return success(res, null, 200, "Salary structure deleted successfully");
});
