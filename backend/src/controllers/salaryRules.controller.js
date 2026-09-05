const asyncHandler = require("../utils/asyncHandler");
const { success, error } = require("../utils/apiResponse");
const salaryRuleService = require("../services/salaryRule.service");

/**
 * GET /api/salary-rules
 */
exports.listSalaryRules = asyncHandler(async (req, res) => {
  const salaryRules = await salaryRuleService.list(req.query);
  return success(res, { salaryRules });
});

/**
 * GET /api/salary-rules/:id
 */
exports.getSalaryRuleById = asyncHandler(async (req, res) => {
  const salaryRule = await salaryRuleService.getById(req.params.id);
  if (!salaryRule) {
    return error(res, "Salary rule not found", 404);
  }
  return success(res, { salaryRule });
});

/**
 * POST /api/salary-rules
 */
exports.createSalaryRule = asyncHandler(async (req, res) => {
  const { name, code, category, computationMethod } = req.body;
  if (!name || !code || !category || !computationMethod) {
    return error(
      res,
      "Validation Error: name, code, category, and computationMethod are required",
      400
    );
  }

  const salaryRule = await salaryRuleService.create(req.body);
  return success(res, { salaryRule }, 201, "Salary rule created successfully");
});

/**
 * PUT /api/salary-rules/:id
 */
exports.updateSalaryRule = asyncHandler(async (req, res) => {
  const salaryRule = await salaryRuleService.update(req.params.id, req.body);
  return success(res, { salaryRule }, 200, "Salary rule updated successfully");
});

/**
 * DELETE /api/salary-rules/:id
 */
exports.deleteSalaryRule = asyncHandler(async (req, res) => {
  await salaryRuleService.delete(req.params.id);
  return success(res, null, 200, "Salary rule deleted successfully");
});
