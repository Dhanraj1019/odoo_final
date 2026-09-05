const passport = require("passport");
const asyncHandler = require("../utils/asyncHandler");
const { success, error } = require("../utils/apiResponse");
const authService = require("../services/auth.service");

/**
 * POST /api/auth/login
 * Authenticates user credentials via LocalStrategy and starts a persistent session
 */
exports.login = (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return error(res, info?.message || "Invalid credentials", 401);
    }

    req.logIn(user, (loginErr) => {
      if (loginErr) {
        return next(loginErr);
      }
      return success(res, { user }, 200, "Logged in successfully");
    });
  })(req, res, next);
};

/**
 * POST /api/auth/logout
 * Terminates the authenticated session and clears the session cookie
 */
exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }

    if (req.session) {
      req.session.destroy((destroyErr) => {
        if (destroyErr) {
          return next(destroyErr);
        }
        res.clearCookie("connect.sid");
        return success(res, null, 200, "Logged out successfully");
      });
    } else {
      res.clearCookie("connect.sid");
      return success(res, null, 200, "Logged out successfully");
    }
  });
};

/**
 * GET /api/auth/me
 * Retrieves current authenticated user session data
 */
exports.me = asyncHandler(async (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
    return error(res, "Unauthorized: No active session", 401);
  }

  const user = await authService.getUserById(req.user._id);
  return success(res, { user: user || req.user });
});
