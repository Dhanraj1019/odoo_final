const mongoose = require("mongoose");
const User = require("../models/User");

/**
 * User Service - Business logic layer for Admin-managed user accounts
 * Specification: 08-API-CONTRACTS.md §2 & 06-DATABASE-DESIGN.md §2
 */

exports.listUsers = async (query = {}) => {
  const filter = {};

  if (query.search) {
    const searchRegex = new RegExp(query.search.trim(), "i");
    filter.$or = [{ fullName: searchRegex }, { email: searchRegex }];
  }

  if (query.role) {
    filter.roles = query.role;
  }

  if (query.status) {
    if (query.status === "active") {
      filter.isActive = true;
    } else if (query.status === "inactive") {
      filter.isActive = false;
    }
  }

  let dbQuery = User.find(filter)
    .select("-passwordHash")
    .sort({ createdAt: -1 });

  if (mongoose.models.Employee) {
    dbQuery = dbQuery.populate("employee");
  }

  return dbQuery;
};

exports.getUserById = async (userId) => {
  let dbQuery = User.findById(userId).select("-passwordHash");
  if (mongoose.models.Employee) {
    dbQuery = dbQuery.populate("employee");
  }
  return dbQuery;
};

exports.createUser = async (userData, creatorId = null) => {
  const { fullName, email, password, roles, employeeId } = userData;

  const normalizedEmail = email ? email.toLowerCase().trim() : "";
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    const err = new Error("User with this email already exists");
    err.statusCode = 409;
    throw err;
  }

  const user = new User({
    fullName: fullName?.trim(),
    email: normalizedEmail,
    password: password,
    roles: Array.isArray(roles) ? roles : [roles],
    employee: employeeId || null,
    createdBy: creatorId,
    isActive: true,
  });

  await user.save();
  return user;
};

exports.updateUser = async (userId, updateData) => {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  if (updateData.fullName !== undefined) {
    user.fullName = updateData.fullName.trim();
  }

  if (updateData.roles !== undefined) {
    user.roles = Array.isArray(updateData.roles)
      ? updateData.roles
      : [updateData.roles];
  }

  if (updateData.employeeId !== undefined) {
    user.employee = updateData.employeeId || null;
  }

  if (updateData.isActive !== undefined) {
    user.isActive = Boolean(updateData.isActive);
  }

  await user.save();
  return user;
};

exports.resetPassword = async (userId, newPassword) => {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  user.password = newPassword;
  await user.save();
  return true;
};

exports.deactivateUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  user.isActive = false;
  await user.save();
  return user;
};
