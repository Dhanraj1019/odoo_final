const express = require("express");
const router = express.Router();
const timeOffAllocationsController = require("../controllers/timeOffAllocations.controller");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");

const HR_ADMIN_ROLES = [
  "Admin",
  "HR Manager",
  "HR Payroll User",
  "HR Payroll Manager",
];

// List and get are scoped per user role
router.get("/", requireAuth, timeOffAllocationsController.listAllocations);
router.get("/:id", requireAuth, timeOffAllocationsController.getAllocationById);

// Create, approve, update, delete are restricted to HR/Admin
router.post(
  "/",
  requireAuth,
  requireRole(...HR_ADMIN_ROLES),
  timeOffAllocationsController.createAllocation
);

router.put(
  "/:id/approve",
  requireAuth,
  requireRole(...HR_ADMIN_ROLES),
  timeOffAllocationsController.approveAllocation
);

router.put(
  "/:id",
  requireAuth,
  requireRole(...HR_ADMIN_ROLES),
  timeOffAllocationsController.updateAllocation
);

router.delete(
  "/:id",
  requireAuth,
  requireRole(...HR_ADMIN_ROLES),
  timeOffAllocationsController.deleteAllocation
);

module.exports = router;
