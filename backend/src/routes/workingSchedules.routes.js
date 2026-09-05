const express = require("express");
const router = express.Router();
const workingSchedulesController = require("../controllers/workingSchedules.controller");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");

const ALLOWED_ROLES = [
  "HR Manager",
  "HR Payroll User",
  "HR Payroll Manager",
  "Admin",
];

router.use(requireAuth, requireRole(ALLOWED_ROLES));

router.get("/", workingSchedulesController.listWorkingSchedules);
router.get("/:id", workingSchedulesController.getWorkingScheduleById);
router.post("/", workingSchedulesController.createWorkingSchedule);
router.put("/:id", workingSchedulesController.updateWorkingSchedule);
router.delete("/:id", workingSchedulesController.deleteWorkingSchedule);

module.exports = router;
