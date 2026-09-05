const mongoose = require("mongoose");

const EMPLOYEE_TYPES = ["Full-Time", "Part-Time", "Contract"];
const EMPLOYEE_STATUSES = ["Active", "Inactive", "Terminated"];

const employeeSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    employeeCode: {
      type: String,
      required: [true, "Employee code is required"],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
    jobPosition: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobPosition",
      default: null,
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    workingSchedule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkingSchedule",
      default: null,
    },
    employeeType: {
      type: String,
      enum: EMPLOYEE_TYPES,
      default: "Full-Time",
    },
    status: {
      type: String,
      enum: EMPLOYEE_STATUSES,
      default: "Active",
    },
    dateOfJoining: {
      type: Date,
      default: null,
    },
    bankDetails: {
      accountNumber: { type: String, default: "" },
      ifscOrRoutingCode: { type: String, default: "" },
      bankName: { type: String, default: "" },
    },
  },
  {
    timestamps: true,
  }
);

employeeSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

employeeSchema.statics.EMPLOYEE_TYPES = EMPLOYEE_TYPES;
employeeSchema.statics.EMPLOYEE_STATUSES = EMPLOYEE_STATUSES;

const Employee = mongoose.model("Employee", employeeSchema);
module.exports = Employee;
