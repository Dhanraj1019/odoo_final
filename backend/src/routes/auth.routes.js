const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const requireAuth = require("../middleware/requireAuth");

// Public login route
router.post("/login", authController.login);

// Authenticated session routes
router.post("/logout", requireAuth, authController.logout);
router.get("/me", requireAuth, authController.me);

module.exports = router;
