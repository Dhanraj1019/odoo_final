const express = require("express");
const router = express.Router();
const departmentsController = require("../controllers/departments.controller");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");

const ALLOWED_ROLES = [
  "HR Manager",
  "HR Payroll User",
  "HR Payroll Manager",
  "Admin",
];

router.use(requireAuth, requireRole(ALLOWED_ROLES));

router.get("/", departmentsController.listDepartments);
router.get("/:id", departmentsController.getDepartmentById);
router.post("/", departmentsController.createDepartment);
router.put("/:id", departmentsController.updateDepartment);
router.delete("/:id", departmentsController.deleteDepartment);

module.exports = router;
