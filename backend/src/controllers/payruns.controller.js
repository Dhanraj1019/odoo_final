const asyncHandler = require("../utils/asyncHandler");
const { success, error } = require("../utils/apiResponse");
const payrollComputeService = require("../services/payrollCompute.service");
const mailerService = require("../services/mailer.service");

/**
 * GET /api/payruns/eligible-employees
 * Query: ?salaryStructure=&periodStart=&periodEnd=&department=&employeeType=
 */
exports.getEligibleEmployees = asyncHandler(async (req, res) => {
  const candidates = await payrollComputeService.getEligibleEmployees(req.query);
  return success(res, { candidates });
});

/**
 * GET /api/payruns
 */
exports.listPayruns = asyncHandler(async (req, res) => {
  const payruns = await payrollComputeService.listPayruns(req.query);
  return success(res, { payruns });
});

/**
 * GET /api/payruns/:id
 */
exports.getPayrunById = asyncHandler(async (req, res) => {
  const payrun = await payrollComputeService.getPayrunById(req.params.id);
  if (!payrun) {
    return error(res, "Payrun not found", 404);
  }
  return success(res, { payrun });
});

/**
 * POST /api/payruns
 */
exports.createPayrun = asyncHandler(async (req, res) => {
  const result = await payrollComputeService.createPayrun(req.body, req.user._id);
  return success(res, result, 201, "Payrun created successfully");
});

/**
 * POST /api/payruns/:id/compute
 */
exports.computePayrun = asyncHandler(async (req, res) => {
  const payrun = await payrollComputeService.computePayrun(req.params.id);
  return success(res, { payrun }, 200, "Payrun computed successfully");
});

/**
 * POST /api/payruns/:id/validate
 */
exports.validatePayrun = asyncHandler(async (req, res) => {
  const payrun = await payrollComputeService.validatePayrun(req.params.id);
  return success(res, { payrun }, 200, "Payrun validated successfully");
});

/**
 * POST /api/payruns/:id/mark-paid
 */
exports.markPaid = asyncHandler(async (req, res) => {
  const payrun = await payrollComputeService.markPaid(req.params.id);
  return success(res, { payrun }, 200, "Payrun marked as paid successfully");
});

/**
 * POST /api/payruns/:id/send-payslips
 */
exports.sendPayslips = asyncHandler(async (req, res) => {
  const results = await mailerService.sendBulkPayslips(req.params.id);
  return success(res, { results }, 200, "Payslips dispatch processed");
});

/**
 * DELETE /api/payruns/:id
 */
exports.deletePayrun = asyncHandler(async (req, res) => {
  await payrollComputeService.deletePayrun(req.params.id);
  return success(res, null, 200, "Payrun deleted successfully");
});
