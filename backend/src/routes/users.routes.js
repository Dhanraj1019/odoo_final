const express = require("express");
const router = express.Router();
const usersController = require("../controllers/users.controller");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");

// 1. User lookup endpoint (accessible to Admin and HR Manager for Employee Smart Linking)
router.get(
  "/lookup",
  requireAuth,
  requireRole("Admin", "HR Manager"),
  usersController.lookupUserByEmail
);

// 2. All administrative user management routes are strictly restricted to Admin users
router.use(requireAuth, requireRole("Admin"));

router.get("/", usersController.listUsers);
router.get("/:id", usersController.getUser);
router.post("/", usersController.createUser);
router.put("/:id", usersController.updateUser);
router.put("/:id/reset-password", usersController.resetPassword);
router.delete("/:id", usersController.deleteUser);

module.exports = router;
