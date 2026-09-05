const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendance.controller");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");

const HR_ADMIN_ROLES = [
  "Admin",
  "HR Manager",
  "HR Payroll User",
  "HR Payroll Manager",
];

// Employee self-service check-in and check-out
router.post("/check-in", requireAuth, attendanceController.checkIn);
router.post("/check-out", requireAuth, attendanceController.checkOut);

// List and detail routes (filtered server-side based on user role)
router.get("/", requireAuth, attendanceController.listAttendances);
router.get("/:id", requireAuth, attendanceController.getAttendanceById);

// HR / Admin manual entries, corrections, and deletions
router.post(
  "/",
  requireAuth,
  requireRole(...HR_ADMIN_ROLES),
  attendanceController.createAttendance
);

router.put(
  "/:id",
  requireAuth,
  requireRole(...HR_ADMIN_ROLES),
  attendanceController.updateAttendance
);

router.delete(
  "/:id",
  requireAuth,
  requireRole(...HR_ADMIN_ROLES),
  attendanceController.deleteAttendance
);

module.exports = router;
