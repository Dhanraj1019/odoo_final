const express = require("express");
const router = express.Router();
const salaryRulesController = require("../controllers/salaryRules.controller");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");

const READ_ROLES = ["Admin", "HR Manager", "HR Payroll User", "HR Payroll Manager"];
const WRITE_ROLES = ["Admin", "HR Payroll Manager"];

router.get("/", requireAuth, requireRole(...READ_ROLES), salaryRulesController.listSalaryRules);
router.get("/:id", requireAuth, requireRole(...READ_ROLES), salaryRulesController.getSalaryRuleById);

router.post("/", requireAuth, requireRole(...WRITE_ROLES), salaryRulesController.createSalaryRule);
router.put("/:id", requireAuth, requireRole(...WRITE_ROLES), salaryRulesController.updateSalaryRule);
router.delete("/:id", requireAuth, requireRole(...WRITE_ROLES), salaryRulesController.deleteSalaryRule);

module.exports = router;
