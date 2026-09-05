const mongoose = require("mongoose");
const Attendance = require("../models/Attendance");
const Employee = require("../models/Employee");
require("../models/WorkingSchedule");
require("../models/Department");
require("../models/User");

/**
 * Attendance Service
 * Implements self-service check-in/out, status derivation, and HR corrections
 * Specifications: 13-ATTENDANCE-MANAGEMENT.md §§4–6 & 08-API-CONTRACTS.md §7
 */

/**
 * Helper to normalize a date to midnight UTC for consistent compound indexing
 */
const normalizeDate = (d = new Date()) => {
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
 * Derives attendance status based on employee's working schedule and checkIn time
 */
const deriveStatus = async (employeeId, checkInDate, workedHours = null) => {
  try {
    const employee = await Employee.findById(employeeId).populate("workingSchedule");
    if (!employee || !employee.workingSchedule || !employee.workingSchedule.days) {
      return "Present";
    }

    const dayName = getDayName(checkInDate);
    const dayConfig = employee.workingSchedule.days.find(
      (d) => d.day && d.day.toLowerCase() === dayName.toLowerCase()
    );

    if (!dayConfig || !dayConfig.startTime) {
      return "Present";
    }

    // Check if Half Day based on worked hours
    if (workedHours !== null && dayConfig.endTime && dayConfig.startTime) {
      const [startH, startM] = dayConfig.startTime.split(":").map(Number);
      const [endH, endM] = dayConfig.endTime.split(":").map(Number);
      const scheduledHours = endH + endM / 60 - (startH + startM / 60) - (dayConfig.breakMinutes || 0) / 60;
      if (scheduledHours > 0 && workedHours < scheduledHours / 2) {
        return "Half Day";
      }
    }

    // Check if Late based on schedule start time + 15 mins grace period
    const [startH, startM] = dayConfig.startTime.split(":").map(Number);
    const checkInH = checkInDate.getUTCHours();
    const checkInM = checkInDate.getUTCMinutes();
    const checkInMinutes = checkInH * 60 + checkInM;
    const scheduledStartMinutes = startH * 60 + startM;

    if (checkInMinutes > scheduledStartMinutes + 15) {
      return "Late";
    }

    return "Present";
  } catch {
    return "Present";
  }
};

/**
 * Self Check-In
 */
exports.checkIn = async (employeeId) => {
  if (!employeeId) {
    const err = new Error("No Employee record linked to user account");
    err.statusCode = 400;
    throw err;
  }

  const now = new Date();
  const todayDate = normalizeDate(now);

  let attendance = await Attendance.findOne({ employee: employeeId, date: todayDate });

  if (attendance && attendance.checkIn && !attendance.checkOut) {
    const err = new Error("Already checked in");
    err.statusCode = 409;
    throw err;
  }

  const status = await deriveStatus(employeeId, now);

  if (attendance) {
    attendance.checkIn = now;
    attendance.checkOut = null;
    attendance.status = status;
  } else {
    attendance = new Attendance({
      employee: employeeId,
      date: todayDate,
      checkIn: now,
      checkOut: null,
      status,
    });
  }

  await attendance.save();
  return exports.getById(attendance._id);
};

/**
 * Self Check-Out
 */
exports.checkOut = async (employeeId) => {
  if (!employeeId) {
    const err = new Error("No Employee record linked to user account");
    err.statusCode = 400;
    throw err;
  }

  const now = new Date();
  const todayDate = normalizeDate(now);

  const attendance = await Attendance.findOne({ employee: employeeId, date: todayDate });

  if (!attendance || !attendance.checkIn) {
    const err = new Error("Not checked in");
    err.statusCode = 409;
    throw err;
  }

  if (attendance.checkOut) {
    const err = new Error("Already checked out");
    err.statusCode = 409;
    throw err;
  }

  attendance.checkOut = now;
  const diffMs = attendance.checkOut.getTime() - attendance.checkIn.getTime();
  const diffHours = Math.max(0, diffMs / (1000 * 60 * 60));
  attendance.workedHours = Math.round(diffHours * 100) / 100;

  // Re-evaluate if it's a Half Day
  const derivedStatus = await deriveStatus(employeeId, attendance.checkIn, attendance.workedHours);
  attendance.status = derivedStatus;

  await attendance.save();
  return exports.getById(attendance._id);
};

/**
 * List Attendance Records with role filtering
 */
exports.list = async (query = {}, user = null) => {
  const filter = {};

  const isHrOrAdmin =
    user &&
    user.roles &&
    user.roles.some((r) =>
      ["Admin", "HR Manager", "HR Payroll User", "HR Payroll Manager"].includes(r)
    );

  if (!isHrOrAdmin) {
    if (!user || !user.employee) {
      return [];
    }
    filter.employee = user.employee;
  } else if (query.employee) {
    filter.employee = query.employee;
  }

  if (query.from || query.to) {
    filter.date = {};
    if (query.from) {
      filter.date.$gte = normalizeDate(query.from);
    }
    if (query.to) {
      filter.date.$lte = normalizeDate(query.to);
    }
  }

  if (query.status) {
    filter.status = query.status;
  }

  return Attendance.find(filter)
    .populate("employee", "fullName employeeCode email department")
    .populate("correctedBy", "name email")
    .sort({ date: -1, createdAt: -1 });
};

/**
 * Get Attendance Record by ID with permission check
 */
exports.getById = async (id, user = null) => {
  const attendance = await Attendance.findById(id)
    .populate("employee", "fullName employeeCode email department")
    .populate("correctedBy", "name email");

  if (!attendance) {
    return null;
  }

  if (user) {
    const isHrOrAdmin =
      user.roles &&
      user.roles.some((r) =>
        ["Admin", "HR Manager", "HR Payroll User", "HR Payroll Manager"].includes(r)
      );

    if (!isHrOrAdmin) {
      const empId = attendance.employee ? attendance.employee._id || attendance.employee : null;
      if (!empId || empId.toString() !== (user.employee ? user.employee.toString() : "")) {
        const err = new Error("Forbidden");
        err.statusCode = 403;
        throw err;
      }
    }
  }

  return attendance;
};

/**
 * HR / Admin Manual Attendance Creation
 */
exports.createManual = async (data, authorUserId) => {
  const normDate = normalizeDate(data.date || new Date());

  let checkIn = data.checkIn ? new Date(data.checkIn) : null;
  let checkOut = data.checkOut ? new Date(data.checkOut) : null;
  let workedHours = data.workedHours !== undefined ? Number(data.workedHours) : 0;

  if (checkIn && checkOut && !data.workedHours) {
    const diffMs = checkOut.getTime() - checkIn.getTime();
    workedHours = Math.round(Math.max(0, diffMs / (1000 * 60 * 60)) * 100) / 100;
  }

  const attendance = new Attendance({
    employee: data.employee,
    date: normDate,
    checkIn,
    checkOut,
    workedHours,
    status: data.status || "Present",
    isManualCorrection: true,
    correctedBy: authorUserId || null,
    notes: data.notes || "",
  });

  await attendance.save();
  return exports.getById(attendance._id);
};

/**
 * HR / Admin Manual Attendance Update
 */
exports.updateManual = async (id, data, authorUserId) => {
  const attendance = await Attendance.findById(id);
  if (!attendance) {
    const err = new Error("Attendance record not found");
    err.statusCode = 404;
    throw err;
  }

  if (data.date !== undefined) attendance.date = normalizeDate(data.date);
  if (data.checkIn !== undefined) attendance.checkIn = data.checkIn ? new Date(data.checkIn) : null;
  if (data.checkOut !== undefined) attendance.checkOut = data.checkOut ? new Date(data.checkOut) : null;
  if (data.status !== undefined) attendance.status = data.status;
  if (data.notes !== undefined) attendance.notes = data.notes;

  if (data.workedHours !== undefined) {
    attendance.workedHours = Number(data.workedHours);
  } else if (attendance.checkIn && attendance.checkOut) {
    const diffMs = attendance.checkOut.getTime() - attendance.checkIn.getTime();
    attendance.workedHours = Math.round(Math.max(0, diffMs / (1000 * 60 * 60)) * 100) / 100;
  }

  attendance.isManualCorrection = true;
  attendance.correctedBy = authorUserId || null;

  await attendance.save();
  return exports.getById(id);
};

/**
 * Delete Attendance Record
 */
exports.delete = async (id) => {
  const attendance = await Attendance.findByIdAndDelete(id);
  if (!attendance) {
    const err = new Error("Attendance record not found");
    err.statusCode = 404;
    throw err;
  }
  return attendance;
};
