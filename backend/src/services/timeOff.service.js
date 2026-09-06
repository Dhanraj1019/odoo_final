const mongoose = require("mongoose");
const TimeOffType = require("../models/TimeOffType");
const TimeOffAllocation = require("../models/TimeOffAllocation");
const TimeOffRequest = require("../models/TimeOffRequest");
const Employee = require("../models/Employee");
require("../models/WorkingSchedule");
require("../models/User");

/**
 * Helper to normalize date to midnight UTC
 */
const normalizeDate = (d) => {
  const dateObj = new Date(d);
  return new Date(
    Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate())
  );
};

const getDayName = (date) => {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[new Date(date).getUTCDay()];
};

/**
 * Calculates working days between startDate and endDate based on employee's working schedule
 */
const calculateDuration = async (employeeId, startDate, endDate, unit = "Days") => {
  const sDate = normalizeDate(startDate);
  const eDate = normalizeDate(endDate);

  if (sDate > eDate) {
    const err = new Error("Start date cannot be after end date");
    err.statusCode = 400;
    throw err;
  }

  if (unit === "Hours") {
    const diffMs = new Date(endDate).getTime() - new Date(startDate).getTime();
    return Math.max(0, Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100);
  }

  // Days calculation
  const employee = await Employee.findById(employeeId).populate("workingSchedule");
  let workingDaysSet = new Set(["monday", "tuesday", "wednesday", "thursday", "friday"]);

  if (
    employee &&
    employee.workingSchedule &&
    Array.isArray(employee.workingSchedule.days) &&
    employee.workingSchedule.days.length > 0
  ) {
    workingDaysSet = new Set(
      employee.workingSchedule.days
        .filter((d) => d.day)
        .map((d) => d.day.toLowerCase())
    );
  }

  let count = 0;
  const current = new Date(sDate);

  while (current <= eDate) {
    const dayName = getDayName(current).toLowerCase();
    if (workingDaysSet.has(dayName)) {
      count++;
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return count;
};

// ==================== TIME OFF TYPES ====================

exports.listTypes = async (query = {}) => {
  const filter = {};
  if (query.status) filter.status = query.status;
  return TimeOffType.find(filter).sort({ name: 1 });
};

exports.getTypeById = async (id) => {
  return TimeOffType.findById(id);
};

exports.createType = async (data) => {
  const type = new TimeOffType(data);
  await type.save();
  return type;
};

exports.updateType = async (id, data) => {
  const type = await TimeOffType.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!type) {
    const err = new Error("Time off type not found");
    err.statusCode = 404;
    throw err;
  }
  return type;
};

exports.deleteType = async (id) => {
  const type = await TimeOffType.findByIdAndDelete(id);
  if (!type) {
    const err = new Error("Time off type not found");
    err.statusCode = 404;
    throw err;
  }
  return type;
};

// ==================== ALLOCATIONS ====================

exports.listAllocations = async (query = {}, user = null) => {
  const filter = {};
  const isHrOrAdmin =
    user &&
    user.roles &&
    user.roles.some((r) =>
      ["Admin", "HR Manager", "HR Payroll User", "HR Payroll Manager"].includes(r)
    );

  if (!isHrOrAdmin) {
    if (!user || !user.employee) return [];
    filter.employee = user.employee;
  } else if (query.employee) {
    filter.employee = query.employee;
  }

  if (query.timeOffType) filter.timeOffType = query.timeOffType;
  if (query.status) filter.status = query.status;

  const allocations = await TimeOffAllocation.find(filter)
    .populate("employee", "fullName employeeCode email")
    .populate("timeOffType")
    .sort({ createdAt: -1 });

  return allocations.filter((a) => a.timeOffType && typeof a.timeOffType === "object");
};

exports.getAllocationById = async (id, user = null) => {
  const allocation = await TimeOffAllocation.findById(id)
    .populate("employee", "fullName employeeCode email")
    .populate("timeOffType");

  if (!allocation) return null;

  if (user) {
    const isHrOrAdmin =
      user.roles &&
      user.roles.some((r) =>
        ["Admin", "HR Manager", "HR Payroll User", "HR Payroll Manager"].includes(r)
      );

    if (!isHrOrAdmin) {
      const empId = allocation.employee ? allocation.employee._id || allocation.employee : null;
      if (!empId || empId.toString() !== (user.employee ? user.employee.toString() : "")) {
        const err = new Error("Forbidden");
        err.statusCode = 403;
        throw err;
      }
    }
  }

  return allocation;
};

exports.createAllocation = async (data) => {
  const allocation = new TimeOffAllocation({
    ...data,
    status: data.status || "Pending Approval",
  });
  await allocation.save();
  return exports.getAllocationById(allocation._id);
};

exports.approveAllocation = async (id) => {
  const allocation = await TimeOffAllocation.findById(id);
  if (!allocation) {
    const err = new Error("Allocation not found");
    err.statusCode = 404;
    throw err;
  }

  allocation.status = "Approved";
  await allocation.save();
  return exports.getAllocationById(id);
};

exports.updateAllocation = async (id, data) => {
  const allocation = await TimeOffAllocation.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!allocation) {
    const err = new Error("Allocation not found");
    err.statusCode = 404;
    throw err;
  }
  return exports.getAllocationById(id);
};

exports.deleteAllocation = async (id) => {
  const allocation = await TimeOffAllocation.findByIdAndDelete(id);
  if (!allocation) {
    const err = new Error("Allocation not found");
    err.statusCode = 404;
    throw err;
  }
  return allocation;
};

// ==================== REQUESTS ====================

exports.listRequests = async (query = {}, user = null) => {
  const filter = {};
  const isHrOrAdmin =
    user &&
    user.roles &&
    user.roles.some((r) =>
      ["Admin", "HR Manager", "HR Payroll User", "HR Payroll Manager"].includes(r)
    );

  if (!isHrOrAdmin) {
    if (!user || !user.employee) return [];
    filter.employee = user.employee;
  } else if (query.employee) {
    filter.employee = query.employee;
  }

  if (query.status) filter.status = query.status;
  if (query.timeOffType) filter.timeOffType = query.timeOffType;

  return TimeOffRequest.find(filter)
    .populate("employee", "fullName employeeCode email")
    .populate("timeOffType")
    .populate("approvedBy", "name email")
    .sort({ startDate: -1, createdAt: -1 });
};

exports.getRequestById = async (id, user = null) => {
  const request = await TimeOffRequest.findById(id)
    .populate("employee", "fullName employeeCode email")
    .populate("timeOffType")
    .populate("approvedBy", "name email");

  if (!request) return null;

  if (user) {
    const isHrOrAdmin =
      user.roles &&
      user.roles.some((r) =>
        ["Admin", "HR Manager", "HR Payroll User", "HR Payroll Manager"].includes(r)
      );

    if (!isHrOrAdmin) {
      const empId = request.employee ? request.employee._id || request.employee : null;
      if (!empId || empId.toString() !== (user.employee ? user.employee.toString() : "")) {
        const err = new Error("Forbidden");
        err.statusCode = 403;
        throw err;
      }
    }
  }

  return request;
};

/**
 * Validates whether an employee's requested time off date range and duration are covered by valid approved allocations.
 *
 * Enforces:
 * 1. Matching employee and TimeOffType
 * 2. Allocation status is "Approved"
 * 3. request.startDate >= allocation.validFrom (if validFrom is specified)
 * 4. request.endDate <= allocation.validTo (if validTo is specified)
 * 5. Sum of remainingAmount across covering allocations >= request.duration
 */
const validateAndGetCoveringAllocations = async (
  employeeId,
  timeOffTypeId,
  startDate,
  endDate,
  duration
) => {
  const timeOffType = await TimeOffType.findById(timeOffTypeId);
  if (!timeOffType) {
    const err = new Error("Invalid time off type");
    err.statusCode = 400;
    throw err;
  }

  // Leave types that do not require allocation (e.g. Unpaid Leave) bypass allocation checks
  if (!timeOffType.requiresAllocation) {
    return { timeOffType, coveringAllocations: [], totalRemaining: Infinity };
  }

  const allApprovedAllocations = await TimeOffAllocation.find({
    employee: employeeId,
    timeOffType: timeOffTypeId,
    status: "Approved",
  });

  if (allApprovedAllocations.length === 0) {
    const err = new Error(
      `No approved leave allocation found for "${timeOffType.name}". Please obtain a leave allocation before applying.`
    );
    err.statusCode = 409;
    throw err;
  }

  const reqStart = normalizeDate(startDate);
  const reqEnd = normalizeDate(endDate);

  if (reqStart > reqEnd) {
    const err = new Error("Start date cannot be after end date");
    err.statusCode = 400;
    throw err;
  }

  // Filter allocations where the requested range falls completely within [validFrom, validTo]
  const coveringAllocations = allApprovedAllocations.filter((alloc) => {
    const allocFrom = alloc.validFrom ? normalizeDate(alloc.validFrom) : null;
    const allocTo = alloc.validTo ? normalizeDate(alloc.validTo) : null;

    if (allocFrom && reqStart < allocFrom) return false;
    if (allocTo && reqEnd > allocTo) return false;
    return true;
  });

  if (coveringAllocations.length === 0) {
    const hasAnyFuture = allApprovedAllocations.some(
      (a) => a.validFrom && reqStart < normalizeDate(a.validFrom)
    );
    const hasAnyPast = allApprovedAllocations.some(
      (a) => a.validTo && reqEnd > normalizeDate(a.validTo)
    );

    const sStr = new Date(startDate).toISOString().slice(0, 10);
    const eStr = new Date(endDate).toISOString().slice(0, 10);
    let message = `The requested leave period (${sStr} to ${eStr}) falls outside the validity period of your approved "${timeOffType.name}" allocation.`;
    if (hasAnyFuture && !hasAnyPast) {
      message = `Requested start date (${sStr}) is before your "${timeOffType.name}" allocation validity period starts.`;
    } else if (hasAnyPast && !hasAnyFuture) {
      message = `Requested end date (${eStr}) exceeds your "${timeOffType.name}" allocation validity period.`;
    }

    const err = new Error(message);
    err.statusCode = 409;
    throw err;
  }

  const totalRemaining = coveringAllocations.reduce(
    (sum, a) => sum + (typeof a.remainingAmount === "number" ? a.remainingAmount : 0),
    0
  );

  if (totalRemaining < duration) {
    const err = new Error(
      `Insufficient leave balance for "${timeOffType.name}". You have ${totalRemaining} ${
        timeOffType.unit || "days"
      } available in the active validity period, but requested ${duration} ${
        timeOffType.unit || "days"
      }.`
    );
    err.statusCode = 409;
    throw err;
  }

  return { timeOffType, coveringAllocations, totalRemaining };
};

const deductFromAllocations = async (coveringAllocations, duration) => {
  let toDeduct = duration;
  for (const alloc of coveringAllocations) {
    if (toDeduct <= 0) break;
    const avail = alloc.remainingAmount;
    if (avail > 0) {
      const deduct = Math.min(avail, toDeduct);
      alloc.takenAmount += deduct;
      await alloc.save();
      toDeduct -= deduct;
    }
  }
};

exports.createRequest = async (data, user = null) => {
  const isHrOrAdmin =
    user &&
    user.roles &&
    user.roles.some((r) =>
      ["Admin", "HR Manager", "HR Payroll User", "HR Payroll Manager"].includes(r)
    );

  let employeeId = data.employee;
  if (user && !isHrOrAdmin) {
    if (!user.employee) {
      const err = new Error("No Employee record linked to account");
      err.statusCode = 400;
      throw err;
    }
    employeeId = user.employee;
  }

  if (!employeeId) {
    const err = new Error("Employee reference is required");
    err.statusCode = 400;
    throw err;
  }

  const timeOffType = await TimeOffType.findById(data.timeOffType);
  if (!timeOffType) {
    const err = new Error("Invalid time off type");
    err.statusCode = 400;
    throw err;
  }

  const sDate = normalizeDate(data.startDate);
  const eDate = normalizeDate(data.endDate);

  if (sDate > eDate) {
    const err = new Error("End date cannot be earlier than the start date.");
    err.statusCode = 400;
    throw err;
  }

  // STEP 5 & 9: Strictly calculate duration on server using employee's working schedule
  const duration = await calculateDuration(
    employeeId,
    data.startDate,
    data.endDate,
    timeOffType.unit
  );

  if (duration <= 0) {
    const err = new Error("No working days found in the selected leave date range.");
    err.statusCode = 400;
    throw err;
  }

  // Validate allocation date range validity and balance
  const { coveringAllocations } = await validateAndGetCoveringAllocations(
    employeeId,
    data.timeOffType,
    data.startDate,
    data.endDate,
    duration
  );

  const request = new TimeOffRequest({
    employee: employeeId,
    timeOffType: data.timeOffType,
    startDate: data.startDate,
    endDate: data.endDate,
    duration,
    reason: data.reason || "",
    status: timeOffType.requiresApproval === false ? "Approved" : "Submitted",
    actionedAt: timeOffType.requiresApproval === false ? new Date() : null,
  });

  // Auto-deduct allocation if requiresApproval is false and requiresAllocation is true
  if (timeOffType.requiresApproval === false && timeOffType.requiresAllocation) {
    await deductFromAllocations(coveringAllocations, duration);
  }

  await request.save();
  return exports.getRequestById(request._id);
};

exports.approveRequest = async (id, approverUser) => {
  const request = await TimeOffRequest.findById(id).populate("timeOffType");
  if (!request) {
    const err = new Error("Time off request not found");
    err.statusCode = 404;
    throw err;
  }

  if (request.status === "Approved") {
    return exports.getRequestById(id);
  }

  const timeOffType = request.timeOffType;

  if (timeOffType && timeOffType.requiresAllocation) {
    const { coveringAllocations } = await validateAndGetCoveringAllocations(
      request.employee,
      timeOffType._id,
      request.startDate,
      request.endDate,
      request.duration
    );

    await deductFromAllocations(coveringAllocations, request.duration);
  }

  request.status = "Approved";
  request.approvedBy = approverUser ? approverUser._id : null;
  request.actionedAt = new Date();

  await request.save();
  return exports.getRequestById(id);
};

exports.refuseRequest = async (id, approverUser, reason = null) => {
  const request = await TimeOffRequest.findById(id);
  if (!request) {
    const err = new Error("Time off request not found");
    err.statusCode = 404;
    throw err;
  }

  request.status = "Refused";
  request.approvedBy = approverUser ? approverUser._id : null;
  request.actionedAt = new Date();
  if (reason) {
    request.reason = reason;
  }

  await request.save();
  return exports.getRequestById(id);
};

exports.deleteRequest = async (id, user = null) => {
  const request = await TimeOffRequest.findById(id);
  if (!request) {
    const err = new Error("Time off request not found");
    err.statusCode = 404;
    throw err;
  }

  const isHrOrAdmin =
    user &&
    user.roles &&
    user.roles.some((r) =>
      ["Admin", "HR Manager", "HR Payroll User", "HR Payroll Manager"].includes(r)
    );

  if (!isHrOrAdmin) {
    const empId = request.employee ? request.employee.toString() : "";
    if (empId !== (user && user.employee ? user.employee.toString() : "")) {
      const err = new Error("Forbidden");
      err.statusCode = 403;
      throw err;
    }
    if (request.status !== "Submitted") {
      const err = new Error("Cannot delete a processed leave request");
      err.statusCode = 400;
      throw err;
    }
  }

  await TimeOffRequest.findByIdAndDelete(id);
  return request;
};

exports.calculateDuration = calculateDuration;
