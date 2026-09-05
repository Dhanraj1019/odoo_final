const { error } = require("../utils/apiResponse");

/**
 * requireRole middleware
 * Enforces role-based access control using role-union / OR logic.
 * A user is authorized if at least one of their assigned roles is in allowedRoles.
 * Specification: 05-RBAC-ROLES-PERMISSIONS.md §2
 *
 * @param {string|string[]} allowedRoles - Role or array of roles permitted to access the route
 */
const requireRole = (...allowedRoles) => {
  const rolesArray = allowedRoles.flat();

  return (req, res, next) => {
    if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
      return error(res, "Unauthorized: Authentication required", 401);
    }

    const userRoles = req.user.roles || [];
    const hasRole = userRoles.some((role) => rolesArray.includes(role));

    if (!hasRole) {
      return error(
        res,
        "Forbidden: Insufficient permissions to access this resource",
        403
      );
    }

    next();
  };
};

module.exports = requireRole;
