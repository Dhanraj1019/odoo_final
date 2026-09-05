const express = require("express");
const router = express.Router();
const jobPositionsController = require("../controllers/jobPositions.controller");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");

const ALLOWED_ROLES = [
  "HR Manager",
  "HR Payroll User",
  "HR Payroll Manager",
  "Admin",
];

router.use(requireAuth, requireRole(ALLOWED_ROLES));

router.get("/", jobPositionsController.listJobPositions);
router.get("/:id", jobPositionsController.getJobPositionById);
router.post("/", jobPositionsController.createJobPosition);
router.put("/:id", jobPositionsController.updateJobPosition);
router.delete("/:id", jobPositionsController.deleteJobPosition);

module.exports = router;
