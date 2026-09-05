/**
 * Centralized Express Error Handling Middleware
 * Matches specification in 07-BACKEND-ARCHITECTURE.md §6 & §7
 */
module.exports = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const payload = {
    success: false,
    message: err.message || "Internal Server Error",
  };

  if (err.errors) {
    payload.errors = err.errors;
  }

  if (process.env.NODE_ENV !== "production" && err.stack) {
    payload.stack = err.stack;
  }

  res.status(statusCode).json(payload);
};
