const asyncHandler = require("../utils/asyncHandler");
const { success, error } = require("../utils/apiResponse");
const payrollComputeService = require("../services/payrollCompute.service");
const pdfService = require("../services/pdf.service");

/**
 * GET /api/payslips
 */
exports.listPayslips = asyncHandler(async (req, res) => {
  const payslips = await payrollComputeService.listPayslips(req.query, req.user);
  return success(res, { payslips });
});

/**
 * GET /api/payslips/:id
 */
exports.getPayslipById = asyncHandler(async (req, res) => {
  const payslip = await payrollComputeService.getPayslipById(req.params.id, req.user);
  if (!payslip) {
    return error(res, "Payslip not found", 404);
  }
  return success(res, { payslip });
});

/**
 * GET /api/payslips/:id/pdf
 * Streams printable PDF
 */
exports.downloadPayslipPdf = asyncHandler(async (req, res) => {
  await pdfService.streamPayslipPdf(req.params.id, res, req.user);
});

/**
 * PUT /api/payslips/:id
 * Manual line override before validation
 */
exports.updatePayslip = asyncHandler(async (req, res) => {
  const payslip = await payrollComputeService.updatePayslipLine(req.params.id, req.body);
  return success(res, { payslip }, 200, "Payslip updated successfully");
});

/**
 * DELETE /api/payslips/:id
 */
exports.deletePayslip = asyncHandler(async (req, res) => {
  await payrollComputeService.deletePayslip(req.params.id);
  return success(res, null, 200, "Payslip deleted successfully");
});
