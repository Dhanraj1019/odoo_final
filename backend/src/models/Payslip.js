const mongoose = require("mongoose");

/**
 * Payslip Model
 * Represents individual computed and paid employee salary snapshot.
 * Specification: 06-DATABASE-DESIGN.md §15 & 15-PAYROLL-ARCHITECTURE.md
 */
const payslipLineSchema = new mongoose.Schema(
  {
    salaryRule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SalaryRule",
      default: null,
    },
    code: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ["Basic", "Allowance", "Gross", "Deduction", "Net"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { _id: false }
);

const payslipSchema = new mongoose.Schema(
  {
    payrun: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payrun",
      required: [true, "Payrun reference is required"],
      index: true,
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "Employee reference is required"],
      index: true,
    },
    contract: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contract",
      default: null,
    },
    salaryStructure: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SalaryStructure",
      required: [true, "Salary structure reference is required"],
    },
    periodStart: {
      type: Date,
      required: [true, "Period start date is required"],
    },
    periodEnd: {
      type: Date,
      required: [true, "Period end date is required"],
    },
    workedDays: {
      type: Number,
      default: 0,
    },
    unpaidLeaveDays: {
      type: Number,
      default: 0,
    },
    overtimeHours: {
      type: Number,
      default: 0,
    },
    lines: {
      type: [payslipLineSchema],
      default: [],
    },
    grossSalary: {
      type: Number,
      default: 0,
    },
    totalDeductions: {
      type: Number,
      default: 0,
    },
    netSalary: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: {
        values: ["Draft", "Computed", "Validated", "Paid"],
        message: "{VALUE} is not a valid payslip status",
      },
      default: "Draft",
      index: true,
    },
    warnings: {
      type: [String],
      default: [],
    },
    pdfGeneratedAt: {
      type: Date,
      default: null,
    },
    emailSentAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

payslipSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

const Payslip = mongoose.model("Payslip", payslipSchema);
module.exports = Payslip;
