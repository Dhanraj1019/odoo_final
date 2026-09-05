const mongoose = require("mongoose");
const Employee = require("../models/Employee");

/**
 * Employee Service
 * Business logic layer for Employee management per 10-EMPLOYEE-MANAGEMENT.md
 */

exports.list = async (query = {}) => {
  const filter = {};

  if (query.department) {
    filter.department = query.department;
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.search) {
    const searchRegex = new RegExp(query.search.trim(), "i");
    filter.$or = [
      { fullName: searchRegex },
      { email: searchRegex },
      { employeeCode: searchRegex },
    ];
  }

  let dbQuery = Employee.find(filter)
    .populate("department")
    .populate("jobPosition")
    .populate("manager", "fullName employeeCode email")
    .sort({ createdAt: -1 });

  if (mongoose.models.WorkingSchedule) {
    dbQuery = dbQuery.populate("workingSchedule");
  }

  return dbQuery;
};

exports.getById = async (id) => {
  let dbQuery = Employee.findById(id)
    .populate("department")
    .populate("jobPosition")
    .populate("manager", "fullName employeeCode email");

  if (mongoose.models.WorkingSchedule) {
    dbQuery = dbQuery.populate("workingSchedule");
  }

  return dbQuery;
};

exports.create = async (data) => {
  const { employeeCode, email, manager } = data;

  const normalizedCode = employeeCode ? employeeCode.trim().toUpperCase() : "";
  const normalizedEmail = email ? email.trim().toLowerCase() : "";

  // Check unique employee code
  const existingCode = await Employee.findOne({ employeeCode: normalizedCode });
  if (existingCode) {
    const err = new Error(`Employee with code ${normalizedCode} already exists`);
    err.statusCode = 409;
    throw err;
  }

  // Check unique email
  const existingEmail = await Employee.findOne({ email: normalizedEmail });
  if (existingEmail) {
    const err = new Error(`Employee with email ${normalizedEmail} already exists`);
    err.statusCode = 409;
    throw err;
  }

  const employee = new Employee({
    ...data,
    employeeCode: normalizedCode,
    email: normalizedEmail,
    manager: manager || null,
  });

  await employee.save();
  return exports.getById(employee._id);
};

exports.update = async (id, data) => {
  const employee = await Employee.findById(id);
  if (!employee) {
    const err = new Error("Employee not found");
    err.statusCode = 404;
    throw err;
  }

  // Manager self-reference validation
  if (data.manager && String(data.manager) === String(id)) {
    const err = new Error("An employee cannot be their own manager");
    err.statusCode = 400;
    throw err;
  }

  // Duplicate checks
  if (data.employeeCode) {
    const normalizedCode = data.employeeCode.trim().toUpperCase();
    const duplicate = await Employee.findOne({
      employeeCode: normalizedCode,
      _id: { $ne: id },
    });
    if (duplicate) {
      const err = new Error(`Employee with code ${normalizedCode} already exists`);
      err.statusCode = 409;
      throw err;
    }
    employee.employeeCode = normalizedCode;
  }

  if (data.email) {
    const normalizedEmail = data.email.trim().toLowerCase();
    const duplicate = await Employee.findOne({
      email: normalizedEmail,
      _id: { $ne: id },
    });
    if (duplicate) {
      const err = new Error(`Employee with email ${normalizedEmail} already exists`);
      err.statusCode = 409;
      throw err;
    }
    employee.email = normalizedEmail;
  }

  if (data.fullName !== undefined) employee.fullName = data.fullName.trim();
  if (data.phone !== undefined) employee.phone = data.phone.trim();
  if (data.department !== undefined) employee.department = data.department || null;
  if (data.jobPosition !== undefined) employee.jobPosition = data.jobPosition || null;
  if (data.manager !== undefined) employee.manager = data.manager || null;
  if (data.workingSchedule !== undefined) employee.workingSchedule = data.workingSchedule || null;
  if (data.employeeType !== undefined) employee.employeeType = data.employeeType;
  if (data.status !== undefined) employee.status = data.status;
  if (data.dateOfJoining !== undefined) employee.dateOfJoining = data.dateOfJoining;
  if (data.bankDetails !== undefined) {
    employee.bankDetails = {
      ...employee.bankDetails?.toObject?.(),
      ...data.bankDetails,
    };
  }

  await employee.save();
  return exports.getById(id);
};

exports.delete = async (id) => {
  const employee = await Employee.findById(id);
  if (!employee) {
    const err = new Error("Employee not found");
    err.statusCode = 404;
    throw err;
  }

  // Soft delete per specification
  employee.status = "Terminated";
  await employee.save();
  return employee;
};

exports.getEmployeeForUser = async (user) => {
  if (user.employee) {
    return exports.getById(user.employee);
  }
  // Fallback to match by email
  return Employee.findOne({ email: user.email.toLowerCase().trim() })
    .populate("department")
    .populate("jobPosition")
    .populate("manager", "fullName employeeCode email");
};
