const express = require("express");
const router = express.Router();
const contractsController = require("../controllers/contracts.controller");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");

const ALLOWED_ROLES = [
  "HR Manager",
  "HR Payroll User",
  "HR Payroll Manager",
  "Admin",
];

router.use(requireAuth, requireRole(ALLOWED_ROLES));

router.get("/", contractsController.listContracts);
router.get("/:id", contractsController.getContractById);
router.post("/", contractsController.createContract);
router.put("/:id", contractsController.updateContract);
router.delete("/:id", contractsController.deleteContract);

module.exports = router;
