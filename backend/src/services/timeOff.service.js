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

exports.createRequest = async (data, user = null) => {
  const isHrOrAdmin =
    user &&
    user.roles &&
    user.roles.some((r) =>
      ["Admin", "HR Manager", "HR Payroll User", "HR Payroll Manager"].includes(r)
    );

  let employeeId = data.employee;
  if (!isHrOrAdmin) {
    if (!user || !user.employee) {
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

  const duration =
    data.duration !== undefined
      ? Number(data.duration)
      : await calculateDuration(employeeId, data.startDate, data.endDate, timeOffType.unit);

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
    const allocations = await TimeOffAllocation.find({
      employee: employeeId,
      timeOffType: data.timeOffType,
      status: "Approved",
    });

    const totalRemaining = allocations.reduce((sum, a) => sum + a.remainingAmount, 0);
    if (totalRemaining < duration) {
      const err = new Error("Insufficient leave balance");
      err.statusCode = 409;
      throw err;
    }

    let toDeduct = duration;
    for (const alloc of allocations) {
      if (toDeduct <= 0) break;
      const avail = alloc.remainingAmount;
      if (avail > 0) {
        const deduct = Math.min(avail, toDeduct);
        alloc.takenAmount += deduct;
        await alloc.save();
        toDeduct -= deduct;
      }
    }
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
    const allocations = await TimeOffAllocation.find({
      employee: request.employee,
      timeOffType: timeOffType._id,
      status: "Approved",
    });

    const totalRemaining = allocations.reduce((sum, a) => sum + a.remainingAmount, 0);
    if (totalRemaining < request.duration) {
      const err = new Error("Insufficient leave balance");
      err.statusCode = 409;
      throw err;
    }

    let toDeduct = request.duration;
    for (const alloc of allocations) {
      if (toDeduct <= 0) break;
      const avail = alloc.remainingAmount;
      if (avail > 0) {
        const deduct = Math.min(avail, toDeduct);
        alloc.takenAmount += deduct;
        await alloc.save();
        toDeduct -= deduct;
      }
    }
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
