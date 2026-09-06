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

  let employeeDoc = null;
  const Employee = mongoose.models.Employee || mongoose.model("Employee");

  if (employeeId) {
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      const err = new Error("Invalid employee ID provided");
      err.statusCode = 400;
      throw err;
    }

    employeeDoc = await Employee.findById(employeeId);
    if (!employeeDoc) {
      const err = new Error("Selected employee record not found");
      err.statusCode = 404;
      throw err;
    }

    // Check if this employee is already linked to an existing user
    const userWithEmp = await User.findOne({ employee: employeeDoc._id });
    if (userWithEmp) {
      const err = new Error("This employee already has a user account");
      err.statusCode = 409;
      throw err;
    }
  }

  // Employee record is the canonical source of truth for full name and email when linked
  const targetFullName = employeeDoc ? employeeDoc.fullName : fullName?.trim();
  const targetEmail = employeeDoc
    ? employeeDoc.email.toLowerCase().trim()
    : email ? email.toLowerCase().trim() : "";

  if (!targetFullName) {
    const err = new Error("Full name is required");
    err.statusCode = 400;
    throw err;
  }

  if (!targetEmail) {
    const err = new Error("Email address is required");
    err.statusCode = 400;
    throw err;
  }

  if (!password || password.length < 6) {
    const err = new Error("Password is required and must be at least 6 characters");
    err.statusCode = 400;
    throw err;
  }

  const roleList = Array.isArray(roles) ? roles : [roles];
  if (!roleList || roleList.length === 0 || !roleList[0]) {
    const err = new Error("At least one valid system role must be assigned");
    err.statusCode = 400;
    throw err;
  }

  // Verify unique email among all users
  const existingUser = await User.findOne({ email: targetEmail });
  if (existingUser) {
    const err = new Error("A user account already exists with this email address");
    err.statusCode = 409;
    throw err;
  }

  const user = new User({
    fullName: targetFullName,
    email: targetEmail,
    password: password,
    roles: roleList,
    employee: employeeDoc ? employeeDoc._id : null,
    createdBy: creatorId,
    isActive: true,
  });

  await user.save();
  return exports.getUserById(user._id);
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

exports.lookupByEmail = async (email) => {
  const normalizedEmail = email ? email.trim().toLowerCase() : "";
  if (!normalizedEmail) {
    return {
      found: false,
      status: "USER_NOT_FOUND",
      message: "No registered user was found with this email.",
      user: null,
      isAlreadyEmployee: false,
      linkedEmployee: null,
      employee: null,
    };
  }

  const Employee = mongoose.models.Employee || mongoose.model("Employee");

  // 1. Read-only search in User collection
  const user = await User.findOne({ email: normalizedEmail })
    .select("_id fullName email roles isActive employee")
    .lean();

  if (!user) {
    return {
      found: false,
      status: "USER_NOT_FOUND",
      message: "No registered user was found with this email.",
      user: null,
      isAlreadyEmployee: false,
      linkedEmployee: null,
      employee: null,
    };
  }

  // 2. Read-only checks for existing employee and data inconsistency
  let linkedEmpDoc = null;
  let hasInconsistency = false;
  let inconsistencyMessage = "";

  // Check 1: User record has an employee ID reference
  if (user.employee) {
    if (!mongoose.Types.ObjectId.isValid(user.employee)) {
      hasInconsistency = true;
      inconsistencyMessage =
        "This user has an invalid employee ID reference. Please review the employee records before creating another employee.";
    } else {
      linkedEmpDoc = await Employee.findById(user.employee)
        .populate("department", "name")
        .populate("jobPosition", "title name")
        .lean();

      if (!linkedEmpDoc) {
        // User.employee references an ID that does NOT exist in employees collection
        hasInconsistency = true;
        inconsistencyMessage =
          "This user has an existing employee relationship that appears inconsistent. Please review the employee records before creating another employee.";
      }
    }
  }

  // Check 2: Check if any Employee document exists with this email address
  const matchingEmployees = await Employee.find({ email: normalizedEmail })
    .populate("department", "name")
    .populate("jobPosition", "title name")
    .lean();

  if (matchingEmployees.length > 1) {
    hasInconsistency = true;
    inconsistencyMessage =
      "Multiple employee records were found for this email address. Please review the employee records before creating another employee.";
  } else if (matchingEmployees.length === 1) {
    const empByEmail = matchingEmployees[0];
    if (user.employee && String(user.employee) !== String(empByEmail._id)) {
      hasInconsistency = true;
      inconsistencyMessage =
        "This user has conflicting employee references. Please review the employee records before creating another employee.";
    } else if (!linkedEmpDoc) {
      linkedEmpDoc = empByEmail;
    }
  }

  const safeUserData = {
    _id: user._id,
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    roles: user.roles,
    isActive: user.isActive,
  };

  // If data inconsistency detected:
  if (hasInconsistency) {
    return {
      found: true,
      status: "EMPLOYEE_LINK_INCONSISTENCY",
      message:
        inconsistencyMessage ||
        "Employee relationship requires administrator review.",
      user: safeUserData,
      isAlreadyEmployee: true,
      hasInconsistency: true,
      linkedEmployee: null,
      employee: null,
    };
  }

  // If user is already linked to an existing valid employee:
  if (linkedEmpDoc) {
    const safeEmployee = {
      _id: linkedEmpDoc._id,
      id: linkedEmpDoc._id,
      name: linkedEmpDoc.fullName,
      fullName: linkedEmpDoc.fullName,
      employeeId: linkedEmpDoc.employeeCode || null,
      employeeCode: linkedEmpDoc.employeeCode || null,
      email: linkedEmpDoc.email,
      department:
        linkedEmpDoc.department?.name ||
        (typeof linkedEmpDoc.department === "string"
          ? linkedEmpDoc.department
          : null),
      jobPosition:
        linkedEmpDoc.jobPosition?.title ||
        linkedEmpDoc.jobPosition?.name ||
        (typeof linkedEmpDoc.jobPosition === "string"
          ? linkedEmpDoc.jobPosition
          : null),
      status: linkedEmpDoc.status || "Active",
    };

    return {
      found: true,
      status: "ALREADY_EMPLOYEE",
      message: "This user is already linked to an employee record.",
      user: safeUserData,
      isAlreadyEmployee: true,
      employee: safeEmployee,
      linkedEmployee: safeEmployee,
    };
  }

  // If user is found and available (not an employee):
  return {
    found: true,
    status: "USER_AVAILABLE",
    message: "Registered user found.",
    user: safeUserData,
    isAlreadyEmployee: false,
    linkedEmployee: null,
    employee: null,
  };
};
