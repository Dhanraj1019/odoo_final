const express = require("express");
const router = express.Router();
const payslipsController = require("../controllers/payslips.controller");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");

const PAYROLL_ROLES = ["Admin", "HR Payroll User", "HR Payroll Manager"];
const WRITE_MGR_ROLES = ["Admin", "HR Payroll Manager"];

// List, detail, and PDF streaming routes (filtered server-side based on user role)
router.get("/", requireAuth, payslipsController.listPayslips);
router.get("/:id/pdf", requireAuth, payslipsController.downloadPayslipPdf);
router.get("/:id", requireAuth, payslipsController.getPayslipById);

// Line updates before validation
router.put("/:id", requireAuth, requireRole(...PAYROLL_ROLES), payslipsController.updatePayslip);

// Delete while in draft
router.delete("/:id", requireAuth, requireRole(...WRITE_MGR_ROLES), payslipsController.deletePayslip);

module.exports = router;
