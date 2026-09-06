const express = require("express");
const router = express.Router();
const timeOffRequestsController = require("../controllers/timeOffRequests.controller");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");

const HR_ADMIN_ROLES = [
  "Admin",
  "HR Manager",
  "HR Payroll User",
  "HR Payroll Manager",
];

// List and detail routes (filtered server-side based on user role)
router.get("/", requireAuth, timeOffRequestsController.listRequests);
router.get("/calculate-duration", requireAuth, timeOffRequestsController.calculateDuration);
router.get("/:id", requireAuth, timeOffRequestsController.getRequestById);

// Submit request (Employee or HR/Admin)
router.post("/", requireAuth, timeOffRequestsController.createRequest);

// Approve / Refuse (HR/Admin only)
router.put(
  "/:id/approve",
  requireAuth,
  requireRole(...HR_ADMIN_ROLES),
  timeOffRequestsController.approveRequest
);

router.put(
  "/:id/refuse",
  requireAuth,
  requireRole(...HR_ADMIN_ROLES),
  timeOffRequestsController.refuseRequest
);

// Delete (Requester if Submitted, or HR/Admin)
router.delete("/:id", requireAuth, timeOffRequestsController.deleteRequest);

module.exports = router;
