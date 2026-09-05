const mongoose = require("mongoose");
const Contract = require("../models/Contract");
require("../models/Department");
require("../models/JobPosition");
require("../models/WorkingSchedule");

/**
 * Contract Service
 * Handles historical contracts, overlap validation, and period-applicable resolution
 * Specifications: 11-CONTRACT-MANAGEMENT.md §§4–5 & 08-API-CONTRACTS.md §5
 */

/**
 * Validates whether an Active contract overlaps with an existing Active contract for the same employee
 */
const checkActiveOverlap = async (
  employeeId,
  startDate,
  endDate,
  excludeContractId = null
) => {
  const sDate = new Date(startDate);
  const eDate = endDate ? new Date(endDate) : null;

  if (eDate && sDate > eDate) {
    const err = new Error("Start date cannot be after end date");
    err.statusCode = 400;
    throw err;
  }

  const query = {
    employee: employeeId,
    status: "Active",
    startDate: { $lte: eDate || new Date("2999-12-31") },
    $or: [{ endDate: null }, { endDate: { $gte: sDate } }],
  };

  if (excludeContractId) {
    query._id = { $ne: excludeContractId };
  }

  const overlap = await Contract.findOne(query);
  if (overlap) {
    const err = new Error("Employee already has an overlapping active contract");
    err.statusCode = 409;
    throw err;
  }
};

exports.list = async (query = {}) => {
  const filter = {};

  if (query.employee) {
    filter.employee = query.employee;
  }

  if (query.department) {
    filter.department = query.department;
  }

  if (query.status) {
    filter.status = query.status;
  }

  let dbQuery = Contract.find(filter)
    .populate("employee", "fullName employeeCode email")
    .populate("department")
    .populate("jobPosition")
    .populate("workingSchedule")
    .sort({ startDate: -1 });

  if (mongoose.models.SalaryStructure) {
    dbQuery = dbQuery.populate("salaryStructure");
  }

  return dbQuery;
};

exports.getById = async (id) => {
  let dbQuery = Contract.findById(id)
    .populate("employee", "fullName employeeCode email")
    .populate("department")
    .populate("jobPosition")
    .populate("workingSchedule");

  if (mongoose.models.SalaryStructure) {
    dbQuery = dbQuery.populate("salaryStructure");
  }

  return dbQuery;
};

exports.create = async (data) => {
  const status = data.status || "Draft";

  if (status === "Active") {
    await checkActiveOverlap(data.employee, data.startDate, data.endDate);
  }

  let ref = data.contractReference;
  if (!ref) {
    const year = new Date(data.startDate).getFullYear() || new Date().getFullYear();
    const count = await Contract.countDocuments();
    ref = `CON/${year}/${String(count + 1).padStart(4, "0")}`;
  }

  const contract = new Contract({
    ...data,
    contractReference: ref,
    status,
  });

  await contract.save();
  return exports.getById(contract._id);
};

exports.update = async (id, data) => {
  const contract = await Contract.findById(id);
  if (!contract) {
    const err = new Error("Contract not found");
    err.statusCode = 404;
    throw err;
  }

  const nextStatus = data.status !== undefined ? data.status : contract.status;
  const nextStartDate = data.startDate !== undefined ? data.startDate : contract.startDate;
  const nextEndDate = data.endDate !== undefined ? data.endDate : contract.endDate;
  const employeeId = contract.employee;

  if (nextStatus === "Active") {
    await checkActiveOverlap(employeeId, nextStartDate, nextEndDate, id);
  }

  if (data.department !== undefined) contract.department = data.department || null;
  if (data.jobPosition !== undefined) contract.jobPosition = data.jobPosition || null;
  if (data.startDate !== undefined) contract.startDate = data.startDate;
  if (data.endDate !== undefined) contract.endDate = data.endDate || null;
  if (data.wagePerMonth !== undefined) contract.wagePerMonth = data.wagePerMonth;
  if (data.salaryStructure !== undefined) contract.salaryStructure = data.salaryStructure || null;
  if (data.workingSchedule !== undefined) contract.workingSchedule = data.workingSchedule || null;
  if (data.status !== undefined) contract.status = data.status;

  await contract.save();
  return exports.getById(id);
};

exports.delete = async (id) => {
  const contract = await Contract.findByIdAndDelete(id);
  if (!contract) {
    const err = new Error("Contract not found");
    err.statusCode = 404;
    throw err;
  }
  return contract;
};

/**
 * Period-Applicable Contract Resolution
 * Core Payroll & Attendance rule from 11-CONTRACT-MANAGEMENT.md §4
 *
 * @param {string|ObjectId} employeeId
 * @param {Date|string} periodStart
 * @param {Date|string} periodEnd
 * @returns {Promise<{ contract: Object|null, issue: string|null }>}
 */
exports.resolveApplicableContract = async (employeeId, periodStart, periodEnd) => {
  const pStart = new Date(periodStart);
  const pEnd = new Date(periodEnd);

  const overlapping = await Contract.find({
    employee: employeeId,
    status: "Active",
    startDate: { $lte: pEnd },
    $or: [{ endDate: null }, { endDate: { $gte: pStart } }],
  })
    .populate("department")
    .populate("jobPosition")
    .populate("workingSchedule");

  if (overlapping.length === 0) {
    return { contract: null, issue: "NO_CONTRACT" };
  }

  const fullyCovering = overlapping.filter(
    (c) =>
      new Date(c.startDate) <= pStart &&
      (c.endDate === null || new Date(c.endDate) >= pEnd)
  );

  if (fullyCovering.length === 1) {
    return { contract: fullyCovering[0], issue: null };
  }

  return { contract: null, issue: "CONTRACT_PERIOD_MISMATCH" };
};
