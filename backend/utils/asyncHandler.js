/**
 * backend/utils/asyncHandler.js
 * Wraps async controller functions to catch errors automatically
 * Prevents unhandled promise rejections
 */

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
