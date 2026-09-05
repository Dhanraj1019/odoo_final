const express = require("express");
const router = express.Router();
const timeOffTypesController = require("../controllers/timeOffTypes.controller");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");

const HR_ADMIN_ROLES = [
  "Admin",
  "HR Manager",
  "HR Payroll User",
  "HR Payroll Manager",
];

router.get("/", requireAuth, timeOffTypesController.listTimeOffTypes);
router.get("/:id", requireAuth, timeOffTypesController.getTimeOffTypeById);

router.post(
  "/",
  requireAuth,
  requireRole(...HR_ADMIN_ROLES),
  timeOffTypesController.createTimeOffType
);

router.put(
  "/:id",
  requireAuth,
  requireRole(...HR_ADMIN_ROLES),
  timeOffTypesController.updateTimeOffType
);

router.delete(
  "/:id",
  requireAuth,
  requireRole(...HR_ADMIN_ROLES),
  timeOffTypesController.deleteTimeOffType
);

module.exports = router;
