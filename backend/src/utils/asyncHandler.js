/**
 * Async controller wrapper to forward thrown/rejected errors to Express error handler
 * Matches specification in 07-BACKEND-ARCHITECTURE.md §6
 */
module.exports = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
