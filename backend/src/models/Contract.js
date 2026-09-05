const mongoose = require("mongoose");

const CONTRACT_STATUSES = ["Draft", "Active", "Expired", "Cancelled"];

const contractSchema = new mongoose.Schema(
  {
    contractReference: {
      type: String,
      trim: true,
      default: "",
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "Employee is required"],
      index: true,
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
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      default: null, // null = open-ended contract
    },
    wagePerMonth: {
      type: Number,
      required: [true, "Monthly wage is required"],
      min: [0, "Wage cannot be negative"],
    },
    salaryStructure: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SalaryStructure",
      default: null, // Will be linked when SalaryStructure is created in Phase 8
    },
    workingSchedule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkingSchedule",
      default: null, // Optional contract override
    },
    status: {
      type: String,
      enum: CONTRACT_STATUSES,
      default: "Draft",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes per 06-DATABASE-DESIGN.md §6
contractSchema.index({ employee: 1, startDate: -1 });
contractSchema.index({ employee: 1, status: 1 });

contractSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

contractSchema.statics.CONTRACT_STATUSES = CONTRACT_STATUSES;

const Contract = mongoose.model("Contract", contractSchema);
module.exports = Contract;
