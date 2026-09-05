const { error } = require("../utils/apiResponse");

/**
 * requireAuth middleware
 * Ensures the request is from an authenticated user with an active session.
 */
const requireAuth = (req, res, next) => {
  if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
    return error(res, "Unauthorized: Authentication required", 401);
  }

  if (!req.user.isActive) {
    return error(res, "Unauthorized: User account is inactive", 401);
  }

  next();
};

module.exports = requireAuth;
