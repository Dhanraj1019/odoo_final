const mongoose = require("mongoose");
const User = require("../models/User");

/**
 * Authentication Service
 * Layered business logic for authentication operations
 */

exports.getUserById = async (userId) => {
  let query = User.findOne({ _id: userId, isActive: true }).select("-passwordHash");
  if (mongoose.models.Employee) {
    query = query.populate("employee");
  }
  return query;
};

exports.findUserByEmail = async (email) => {
  return User.findOne({ email: email.toLowerCase().trim(), isActive: true });
};
