/**
 * Centralized Express Error Handling Middleware
 * Matches specification in 07-BACKEND-ARCHITECTURE.md §6 & §7
 */
module.exports = (err, req, res, next) => {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || "Internal Server Error";
  let errors = err.errors;
  let field = err.field;

  // Handle MongoDB duplicate key error (code 11000)
  if (err.code === 11000) {
    statusCode = 409;
    const dupField = err.keyValue ? Object.keys(err.keyValue)[0] : "field";
    if (dupField === "code") {
      message = "This rule code is already in use. Try a different code.";
      field = "code";
      errors = { code: "This rule code is already in use. Try a different code." };
    } else if (dupField === "email") {
      message = "An employee or user already exists with this email address.";
      field = "email";
      errors = { email: "An employee or user already exists with this email address." };
    } else if (dupField === "employeeCode") {
      message = "An employee with this code already exists.";
      field = "employeeCode";
      errors = { employeeCode: "An employee with this code already exists." };
    } else {
      const val = err.keyValue ? err.keyValue[dupField] : "";
      message = `Duplicate value '${val}' for field '${dupField}' already exists.`;
      field = dupField;
      errors = { [dupField]: message };
    }
  }

  const payload = {
    success: false,
    message,
  };

  if (field) {
    payload.field = field;
  }

  if (errors) {
    payload.errors = errors;
  }

  if (process.env.NODE_ENV !== "production" && err.stack && err.code !== 11000 && !err.statusCode) {
    payload.stack = err.stack;
  }

  res.status(statusCode).json(payload);
};
