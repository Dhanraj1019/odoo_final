/**
 * Standard API Response Envelope Helpers
 * Matches specification in 07-BACKEND-ARCHITECTURE.md §7 & 08-API-CONTRACTS.md
 */

exports.success = (res, data = {}, status = 200, message = null) => {
  const payload = {
    success: true,
    data,
  };
  if (message) {
    payload.message = message;
  }
  return res.status(status).json(payload);
};

exports.error = (res, message = "Internal Server Error", status = 500, errors = null) => {
  const payload = {
    success: false,
    message,
  };
  if (errors) {
    payload.errors = errors;
  }
  return res.status(status).json(payload);
};
