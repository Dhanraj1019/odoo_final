const express = require("express");
const router = express.Router();
const employeesController = require("../controllers/employees.controller");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");

const HR_ROLES = [
  "HR Manager",
  "HR Payroll User",
  "HR Payroll Manager",
  "Admin",
];

// 1. Current user's own employee record (available to any authenticated role including 'Employee')
router.get("/me", requireAuth, employeesController.getMyEmployeeProfile);

// 2. HR & Admin managed employee endpoints
router.get("/lookup", requireAuth, requireRole(HR_ROLES), employeesController.lookupEmployeeByEmail);
router.get("/", requireAuth, requireRole(HR_ROLES), employeesController.listEmployees);
router.get("/:id", requireAuth, requireRole(HR_ROLES), employeesController.getEmployeeById);
router.post("/", requireAuth, requireRole(HR_ROLES), employeesController.createEmployee);
router.put("/:id", requireAuth, requireRole(HR_ROLES), employeesController.updateEmployee);
router.delete("/:id", requireAuth, requireRole(HR_ROLES), employeesController.deleteEmployee);

module.exports = router;
