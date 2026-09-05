const mongoose = require("mongoose");

/**
 * Payrun Model
 * Represents a monthly payroll execution lifecycle (Draft -> Computed -> Validated -> Paid)
 * Specification: 06-DATABASE-DESIGN.md §14 & 15-PAYROLL-ARCHITECTURE.md
 */
const payrunSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Payrun name is required"],
      trim: true,
    },
    salaryStructure: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SalaryStructure",
      required: [true, "Salary structure is required"],
    },
    periodStart: {
      type: Date,
      required: [true, "Period start date is required"],
    },
    periodEnd: {
      type: Date,
      required: [true, "Period end date is required"],
    },
    employeeType: {
      type: String,
      default: "All",
      trim: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
    selectedEmployees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
      },
    ],
    status: {
      type: String,
      enum: {
        values: ["Draft", "Computed", "Validated", "Paid"],
        message: "{VALUE} is not a valid payrun status",
      },
      default: "Draft",
      index: true,
    },
    warnings: {
      type: [String],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    computedAt: {
      type: Date,
      default: null,
    },
    validatedAt: {
      type: Date,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    payslipsSentAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

payrunSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

const Payrun = mongoose.model("Payrun", payrunSchema);
module.exports = Payrun;
