const asyncHandler = require("../utils/asyncHandler");
const { success, error } = require("../utils/apiResponse");
const contractService = require("../services/contract.service");

/**
 * GET /api/contracts
 * Query: ?employee=&department=&status=
 */
exports.listContracts = asyncHandler(async (req, res) => {
  const contracts = await contractService.list(req.query);
  return success(res, { contracts });
});

/**
 * GET /api/contracts/:id
 */
exports.getContractById = asyncHandler(async (req, res) => {
  const contract = await contractService.getById(req.params.id);
  if (!contract) {
    return error(res, "Contract not found", 404);
  }
  return success(res, { contract });
});

/**
 * POST /api/contracts
 */
exports.createContract = asyncHandler(async (req, res) => {
  const { employee, startDate, wagePerMonth } = req.body;
  if (!employee || !startDate || wagePerMonth === undefined) {
    return error(
      res,
      "Validation Error: employee, startDate, and wagePerMonth are required",
      400
    );
  }

  const contract = await contractService.create(req.body);
  return success(res, { contract }, 201, "Contract created successfully");
});

/**
 * PUT /api/contracts/:id
 */
exports.updateContract = asyncHandler(async (req, res) => {
  const contract = await contractService.update(req.params.id, req.body);
  return success(res, { contract }, 200, "Contract updated successfully");
});

/**
 * DELETE /api/contracts/:id
 */
exports.deleteContract = asyncHandler(async (req, res) => {
  await contractService.delete(req.params.id);
  return success(res, null, 200, "Contract deleted successfully");
});
