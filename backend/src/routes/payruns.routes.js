const express = require("express");
const router = express.Router();
const payrunsController = require("../controllers/payruns.controller");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");

const PAYROLL_ROLES = ["Admin", "HR Payroll User", "HR Payroll Manager"];
const WRITE_MGR_ROLES = ["Admin", "HR Payroll Manager"];

router.get("/eligible-employees", requireAuth, requireRole(...PAYROLL_ROLES), payrunsController.getEligibleEmployees);
router.get("/", requireAuth, requireRole(...PAYROLL_ROLES), payrunsController.listPayruns);
router.get("/:id", requireAuth, requireRole(...PAYROLL_ROLES), payrunsController.getPayrunById);

router.post("/", requireAuth, requireRole(...PAYROLL_ROLES), payrunsController.createPayrun);
router.post("/:id/compute", requireAuth, requireRole(...PAYROLL_ROLES), payrunsController.computePayrun);
router.post("/:id/validate", requireAuth, requireRole(...PAYROLL_ROLES), payrunsController.validatePayrun);
router.post("/:id/mark-paid", requireAuth, requireRole(...PAYROLL_ROLES), payrunsController.markPaid);
router.post("/:id/send-payslips", requireAuth, requireRole(...PAYROLL_ROLES), payrunsController.sendPayslips);

router.delete("/:id", requireAuth, requireRole(...WRITE_MGR_ROLES), payrunsController.deletePayrun);

module.exports = router;
