const mongoose = require("mongoose");

/**
 * SalaryRule Model
 * Defines individual salary computation components (Basic, HRA, PF, etc.)
 * Specification: 06-DATABASE-DESIGN.md §13 & 16-PAYROLL-FORMULA-ENGINE.md §7
 */
const salaryRuleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Salary rule name is required"],
      trim: true,
    },
    code: {
      type: String,
      required: [true, "Salary rule code is required"],
      unique: true,
      trim: true,
      uppercase: true,
      match: [/^[A-Z0-9_]+$/, "Code must contain only uppercase letters, numbers, and underscores"],
    },
    category: {
      type: String,
      enum: {
        values: ["Basic", "Allowance", "Gross", "Deduction", "Net"],
        message: "{VALUE} is not a valid salary rule category",
      },
      required: [true, "Category is required"],
    },
    sequence: {
      type: Number,
      required: [true, "Sequence is required"],
      default: 10,
    },
    computationMethod: {
      type: String,
      enum: {
        values: ["Fixed", "Percentage", "Formula"],
        message: "{VALUE} is not a valid computation method",
      },
      required: [true, "Computation method is required"],
    },
    fixedAmount: {
      type: Number,
      default: null,
    },
    percentageOf: {
      type: String,
      default: null,
      trim: true,
      uppercase: true,
    },
    percentageValue: {
      type: Number,
      default: null,
    },
    formulaExpression: {
      type: String,
      default: null,
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ["Active", "Archived"],
        message: "{VALUE} is not a valid status",
      },
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

salaryRuleSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

const SalaryRule = mongoose.model("SalaryRule", salaryRuleSchema);
module.exports = SalaryRule;
