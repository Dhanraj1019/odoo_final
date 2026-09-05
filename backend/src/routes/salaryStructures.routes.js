const express = require("express");
const router = express.Router();
const salaryStructuresController = require("../controllers/salaryStructures.controller");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");

const READ_ROLES = ["Admin", "HR Payroll User", "HR Payroll Manager"];
const WRITE_ROLES = ["Admin", "HR Payroll Manager"];

router.get("/", requireAuth, requireRole(...READ_ROLES), salaryStructuresController.listSalaryStructures);
router.get("/:id", requireAuth, requireRole(...READ_ROLES), salaryStructuresController.getSalaryStructureById);

router.post("/", requireAuth, requireRole(...WRITE_ROLES), salaryStructuresController.createSalaryStructure);
router.put("/:id", requireAuth, requireRole(...WRITE_ROLES), salaryStructuresController.updateSalaryStructure);
router.delete("/:id", requireAuth, requireRole(...WRITE_ROLES), salaryStructuresController.deleteSalaryStructure);

module.exports = router;
