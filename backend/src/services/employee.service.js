const mongoose = require("mongoose");
const Employee = require("../models/Employee");
const User = require("../models/User");

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
    const [matchingDepts, matchingJobs] = await Promise.all([
      mongoose.model("Department").find({ name: searchRegex }).select("_id"),
      mongoose.model("JobPosition").find({ name: searchRegex }).select("_id"),
    ]);
    const deptIds = matchingDepts.map((d) => d._id);
    const jobIds = matchingJobs.map((j) => j._id);

    filter.$or = [
      { fullName: searchRegex },
      { email: searchRegex },
      { employeeCode: searchRegex },
      ...(deptIds.length > 0 ? [{ department: { $in: deptIds } }] : []),
      ...(jobIds.length > 0 ? [{ jobPosition: { $in: jobIds } }] : []),
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
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error("Invalid Employee ID");
    err.statusCode = 400;
    throw err;
  }

  let dbQuery = Employee.findById(id)
    .populate("department")
    .populate("jobPosition")
    .populate("manager", "fullName employeeCode email");

  if (mongoose.models.WorkingSchedule) {
    dbQuery = dbQuery.populate("workingSchedule");
  }

  const employee = await dbQuery;
  if (!employee) return null;

  // Check if linked to a User account
  const linkedUser = await User.findOne({
    $or: [{ employee: employee._id }, { email: employee.email }],
  })
    .select("_id fullName email roles isActive")
    .lean();

  const employeeObj = employee.toObject();
  employeeObj.isLinkedToUser = Boolean(
    linkedUser && String(linkedUser.employee) === String(employee._id)
  );
  employeeObj.linkedUser = linkedUser || null;

  return employeeObj;
};

/**
 * Automatically generates the next sequential employee code.
 * Scans existing employee records with codes matching EMP<digits>,
 * finds the highest numeric value, and increments by 1.
 * Formats with at least 3 digits (e.g. EMP001, EMP010, EMP100).
 */
exports.generateNextEmployeeCode = async () => {
  const employees = await Employee.find({
    employeeCode: { $regex: /^EMP\d+$/i },
  })
    .select("employeeCode")
    .lean();

  let maxNum = 0;
  for (const emp of employees) {
    const code = emp.employeeCode || "";
    const match = code.match(/^EMP(\d+)$/i);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }

  const nextNum = maxNum + 1;
  const padded = String(nextNum).padStart(3, "0");
  return `EMP${padded}`;
};

exports.create = async (data, creatorId = null) => {
  const { email, manager, linkUserId, password } = data;

  const normalizedEmail = email ? email.trim().toLowerCase() : "";

  // 1. If password is provided (Manual Employee with system account):
  if (password) {
    if (typeof password !== "string" || password.length < 8) {
      const err = new Error("Password must contain at least 8 characters");
      err.statusCode = 400;
      throw err;
    }

    // Verify whether a User account with this email already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      const err = new Error(
        "A user account with this email already exists. Please use 'Find Existing User' instead."
      );
      err.statusCode = 409;
      err.code = "USER_EMAIL_EXISTS";
      err.user = {
        _id: existingUser._id,
        id: existingUser._id,
        fullName: existingUser.fullName,
        email: existingUser.email,
        roles: existingUser.roles,
        isActive: existingUser.isActive,
      };
      throw err;
    }
  }

  // 2. If linkUserId is provided, pre-validate the User account
  if (linkUserId) {
    const userToLink = await User.findById(linkUserId);
    if (!userToLink) {
      const err = new Error("User account not found for linking");
      err.statusCode = 404;
      throw err;
    }
    if (!userToLink.isActive) {
      const err = new Error("User account is inactive and cannot be linked");
      err.statusCode = 400;
      throw err;
    }
    if (userToLink.employee) {
      const err = new Error("User account is already linked to another Employee record");
      err.statusCode = 409;
      throw err;
    }
  }

  // 3. Check unique email in Employee collection
  const existingEmail = await Employee.findOne({ email: normalizedEmail })
    .populate("department", "name")
    .populate("jobPosition", "title name")
    .lean();

  if (existingEmail) {
    const err = new Error("An employee already exists with this email.");
    err.statusCode = 409;
    err.code = "EMPLOYEE_EMAIL_EXISTS";
    err.employee = {
      _id: existingEmail._id,
      id: existingEmail._id,
      name: existingEmail.fullName,
      fullName: existingEmail.fullName,
      email: existingEmail.email,
      employeeId: existingEmail.employeeCode || null,
      employeeCode: existingEmail.employeeCode || null,
      department:
        existingEmail.department?.name ||
        (typeof existingEmail.department === "string"
          ? existingEmail.department
          : null),
      jobPosition:
        existingEmail.jobPosition?.title ||
        existingEmail.jobPosition?.name ||
        (typeof existingEmail.jobPosition === "string"
          ? existingEmail.jobPosition
          : null),
      status: existingEmail.status || "Active",
    };
    throw err;
  }

  // 4. Robust Employee Code Generation with Concurrency & Retry handling
  const MAX_RETRIES = 5;
  let employee = null;
  let attempts = 0;

  while (attempts < MAX_RETRIES) {
    attempts++;
    const generatedCode = await exports.generateNextEmployeeCode();

    try {
      const newEmployee = new Employee({
        ...data,
        employeeCode: generatedCode,
        email: normalizedEmail,
        manager: manager || null,
      });

      employee = await newEmployee.save();
      break; // Successfully saved
    } catch (saveErr) {
      // Check for MongoDB duplicate key error on employeeCode
      const isDuplicateCode =
        saveErr.code === 11000 &&
        (saveErr.keyPattern?.employeeCode || (saveErr.message && saveErr.message.includes("employeeCode")));

      if (isDuplicateCode && attempts < MAX_RETRIES) {
        // Concurrency collision, loop and regenerate next code
        continue;
      }

      if (
        saveErr.code === 11000 &&
        (saveErr.keyPattern?.email || (saveErr.message && saveErr.message.includes("email")))
      ) {
        const err = new Error("An employee with this email was created by another request. Please refresh and try again.");
        err.statusCode = 409;
        err.code = "EMPLOYEE_EMAIL_EXISTS";
        throw err;
      }

      if (isDuplicateCode) {
        const err = new Error("Unable to generate a unique employee code. Please try again.");
        err.statusCode = 500;
        throw err;
      }

      throw saveErr;
    }
  }

  if (!employee) {
    const err = new Error("Unable to generate a unique employee code. Please try again.");
    err.statusCode = 500;
    throw err;
  }

  // 5. If linkUserId was provided, atomically update User.employee with compensating rollback guard
  if (linkUserId) {
    const updatedUser = await User.findOneAndUpdate(
      { _id: linkUserId, employee: null, isActive: true },
      { $set: { employee: employee._id } },
      { returnDocument: "after" }
    );

    if (!updatedUser) {
      // Compensating rollback: delete newly created employee if atomic link fails (e.g. race condition)
      try {
        await Employee.findByIdAndDelete(employee._id);
      } catch (cleanupErr) {
        console.error("Failed to clean up employee during rollback:", cleanupErr);
      }
      const err = new Error("User account could not be linked or was modified concurrently");
      err.statusCode = 409;
      throw err;
    }
  } else if (password) {
    // Create new authentication / User account securely linked to employee
    try {
      const newUser = new User({
        fullName: employee.fullName,
        email: normalizedEmail,
        password: password,
        roles: Array.isArray(data.roles) && data.roles.length > 0 ? data.roles : ["Employee"],
        employee: employee._id,
        isActive: employee.status !== "Inactive" && employee.status !== "Terminated",
        createdBy: creatorId || null,
      });
      await newUser.save();
    } catch (userCreateErr) {
      // Compensating rollback: remove newly created employee if user creation fails
      try {
        await Employee.findByIdAndDelete(employee._id);
      } catch (cleanupErr) {
        console.error("Failed to clean up employee during user creation rollback:", cleanupErr);
      }
      throw userCreateErr;
    }
  } else {
    // If created without password and without explicit linkUserId, auto-link to any unlinked user account matching the email
    await User.findOneAndUpdate(
      { email: normalizedEmail, employee: null },
      { $set: { employee: employee._id } }
    );
  }

  return exports.getById(employee._id);
};

/**
 * Change or set password for an employee's linked User account.
 * If no User account exists for this employee, provisions a new linked User account.
 */
exports.updatePassword = async (employeeId, newPassword, adminUserId = null) => {
  if (!mongoose.Types.ObjectId.isValid(employeeId)) {
    const err = new Error("Invalid Employee ID");
    err.statusCode = 400;
    throw err;
  }

  if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
    const err = new Error("New password must contain at least 8 characters");
    err.statusCode = 400;
    throw err;
  }

  const employee = await Employee.findById(employeeId);
  if (!employee) {
    const err = new Error("Employee not found");
    err.statusCode = 404;
    throw err;
  }

  // Find linked User account
  let user = await User.findOne({
    $or: [{ employee: employee._id }, { email: employee.email }],
  });

  if (!user) {
    // If no user account exists yet, provision a login user account linked to this employee
    user = new User({
      fullName: employee.fullName,
      email: employee.email,
      password: newPassword,
      roles: ["Employee"],
      employee: employee._id,
      isActive: employee.status !== "Inactive" && employee.status !== "Terminated",
      createdBy: adminUserId,
    });
    await user.save();
  } else {
    // Update existing user password
    user.password = newPassword;
    if (!user.employee) {
      user.employee = employee._id;
    }
    await user.save();
  }

  return {
    success: true,
    message: "Password updated successfully",
    user: {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      roles: user.roles,
      isActive: user.isActive,
    },
  };
};

const ALLOWED_UPDATE_FIELDS = [
  "fullName",
  "email",
  "phone",
  "department",
  "jobPosition",
  "manager",
  "workingSchedule",
  "employeeType",
  "status",
  "dateOfJoining",
  "bankDetails",
  "employeeCode",
];

exports.update = async (id, data = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error("Invalid Employee ID");
    err.statusCode = 400;
    throw err;
  }

  const employee = await Employee.findById(id);
  if (!employee) {
    const err = new Error("Employee not found");
    err.statusCode = 404;
    throw err;
  }

  // Whitelist filtering
  const safeData = {};
  for (const field of ALLOWED_UPDATE_FIELDS) {
    if (data[field] !== undefined) {
      safeData[field] = data[field];
    }
  }

  // Manager self-reference validation
  if (safeData.manager && String(safeData.manager) === String(id)) {
    const err = new Error("An employee cannot be their own manager");
    err.statusCode = 400;
    throw err;
  }

  // Detect linked User account
  const linkedUser = await User.findOne({
    $or: [
      { employee: id },
      { email: employee.email, employee: id },
      ...(employee.user ? [{ _id: employee.user }] : []),
    ],
  });

  // 1. Employee Code validation
  if (safeData.employeeCode !== undefined) {
    const normalizedCode = safeData.employeeCode.trim().toUpperCase();
    if (normalizedCode !== employee.employeeCode) {
      const duplicate = await Employee.findOne({
        employeeCode: normalizedCode,
        _id: { $ne: id },
      });
      if (duplicate) {
        const err = new Error(`Employee code already exists.`);
        err.statusCode = 409;
        err.code = "EMPLOYEE_CODE_EXISTS";
        throw err;
      }
      employee.employeeCode = normalizedCode;
    }
  }

  // 2. Email validation & synchronization
  let userNeedsSave = false;
  if (safeData.email !== undefined) {
    const normalizedEmail = safeData.email.trim().toLowerCase();
    if (normalizedEmail !== employee.email) {
      // Check for conflict in Employee collection
      const dupEmployee = await Employee.findOne({
        email: normalizedEmail,
        _id: { $ne: id },
      });
      if (dupEmployee) {
        const err = new Error("Another employee already exists with this email address.");
        err.statusCode = 409;
        err.code = "EMPLOYEE_EMAIL_EXISTS";
        throw err;
      }

      // If linked to User, check for conflict in User collection as well
      if (linkedUser) {
        const dupUser = await User.findOne({
          email: normalizedEmail,
          _id: { $ne: linkedUser._id },
        });
        if (dupUser) {
          const err = new Error(
            "Cannot update email because another user account already uses this email address."
          );
          err.statusCode = 409;
          err.code = "USER_EMAIL_EXISTS";
          throw err;
        }
        linkedUser.email = normalizedEmail;
        userNeedsSave = true;
      }

      employee.email = normalizedEmail;
    }
  }

  // 3. Full Name synchronization
  if (safeData.fullName !== undefined) {
    const normalizedName = safeData.fullName.trim();
    employee.fullName = normalizedName;
    if (linkedUser && linkedUser.fullName !== normalizedName) {
      linkedUser.fullName = normalizedName;
      userNeedsSave = true;
    }
  }

  // 4. Update remaining whitelisted employee fields
  if (safeData.phone !== undefined) employee.phone = safeData.phone.trim();
  if (safeData.department !== undefined) employee.department = safeData.department || null;
  if (safeData.jobPosition !== undefined) employee.jobPosition = safeData.jobPosition || null;
  if (safeData.manager !== undefined) employee.manager = safeData.manager || null;
  if (safeData.workingSchedule !== undefined) employee.workingSchedule = safeData.workingSchedule || null;
  if (safeData.employeeType !== undefined) employee.employeeType = safeData.employeeType;
  if (safeData.status !== undefined) employee.status = safeData.status;
  if (safeData.dateOfJoining !== undefined) employee.dateOfJoining = safeData.dateOfJoining || null;
  if (safeData.bankDetails !== undefined) {
    employee.bankDetails = {
      ...employee.bankDetails?.toObject?.(),
      ...safeData.bankDetails,
    };
  }

  // Save both models atomically
  await employee.save();
  if (userNeedsSave && linkedUser) {
    await linkedUser.save();
  }

  return exports.getById(id);
};

exports.delete = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error("Invalid Employee ID");
    err.statusCode = 400;
    throw err;
  }

  const employee = await Employee.findById(id);
  if (!employee) {
    const err = new Error("Employee not found");
    err.statusCode = 404;
    throw err;
  }

  // Inspect related operational records
  const Contract = mongoose.models.Contract || require("../models/Contract");
  const Payslip = mongoose.models.Payslip || require("../models/Payslip");
  const Attendance = mongoose.models.Attendance || require("../models/Attendance");
  const TimeOffRequest = mongoose.models.TimeOffRequest || require("../models/TimeOffRequest");

  const [contractCount, payslipCount, attendanceCount, timeOffCount] = await Promise.all([
    Contract.countDocuments({ employee: id }),
    Payslip.countDocuments({ employee: id }),
    Attendance.countDocuments({ employee: id }),
    TimeOffRequest.countDocuments({ employee: id }),
  ]);

  if (contractCount > 0 || payslipCount > 0 || attendanceCount > 0 || timeOffCount > 0) {
    const details = [];
    if (contractCount > 0) details.push(`${contractCount} contract(s)`);
    if (payslipCount > 0) details.push(`${payslipCount} payslip(s)`);
    if (attendanceCount > 0) details.push(`${attendanceCount} attendance record(s)`);
    if (timeOffCount > 0) details.push(`${timeOffCount} leave request(s)`);

    const err = new Error(
      `This employee cannot be deleted because related operational records exist (${details.join(", ")}).`
    );
    err.statusCode = 409;
    err.code = "RELATED_RECORDS_EXIST";
    throw err;
  }

  // Clean up any time off allocation records for this employee
  try {
    const TimeOffAllocation =
      mongoose.models.TimeOffAllocation || require("../models/TimeOffAllocation");
    await TimeOffAllocation.deleteMany({ employee: id });
  } catch (allocErr) {
    console.warn("TimeOffAllocation cleanup warning:", allocErr.message);
  }

  // 1. Unlink any user accounts referencing this employee (DO NOT delete the User account or credentials)
  await User.updateMany(
    {
      $or: [
        { employee: id },
        { email: employee.email, employee: id },
        ...(employee.user ? [{ _id: employee.user }] : []),
      ],
    },
    { $set: { employee: null } }
  );

  // 2. Unlink any other employees whose manager was this employee
  await Employee.updateMany(
    { manager: id },
    { $set: { manager: null } }
  );

  // 3. Remove the Employee document
  await Employee.findByIdAndDelete(id);

  return { success: true, message: "Employee deleted successfully." };
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

/**
 * Lookup Employee by email for User Provisioning
 * Specification: Returns safe employee info + user account existence check
 */
exports.lookupByEmail = async (email) => {
  const normalizedEmail = email ? email.trim().toLowerCase() : "";
  if (!normalizedEmail) {
    return {
      found: false,
      employee: null,
    };
  }

  const employee = await Employee.findOne({ email: normalizedEmail })
    .populate("department")
    .populate("jobPosition");

  if (!employee) {
    return {
      found: false,
      employee: null,
    };
  }

  // Check if a User account already exists for this employee or email
  const existingUser = await User.findOne({
    $or: [{ employee: employee._id }, { email: normalizedEmail }],
  }).select("_id fullName email roles isActive");

  const safeEmployee = {
    _id: employee._id,
    fullName: employee.fullName,
    email: employee.email,
    employeeCode: employee.employeeCode,
    department: employee.department?.name || null,
    jobPosition: employee.jobPosition?.title || employee.jobPosition?.name || null,
    status: employee.status,
    phone: employee.phone || null,
  };

  return {
    found: true,
    employee: safeEmployee,
    hasUserAccount: Boolean(existingUser),
    existingUser: existingUser
      ? {
        _id: existingUser._id,
        fullName: existingUser.fullName,
        email: existingUser.email,
        isActive: existingUser.isActive,
      }
      : null,
  };
};
