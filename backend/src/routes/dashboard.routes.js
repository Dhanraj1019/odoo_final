const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboard.controller");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");

router.use(requireAuth);

router.get(
  "/",
  requireRole("Admin", "HR Manager", "HR Payroll Manager", "HR Payroll User"),
  dashboardController.getDashboard
);

module.exports = router;
