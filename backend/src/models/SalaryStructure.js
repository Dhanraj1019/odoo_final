const mongoose = require("mongoose");

/**
 * SalaryStructure Model
 * Groups and sequences SalaryRules for payroll calculation.
 * Specification: 06-DATABASE-DESIGN.md §12 & 15-PAYROLL-ARCHITECTURE.md §4
 */
const salaryStructureSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Salary structure name is required"],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    rules: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SalaryRule",
      },
    ],
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

salaryStructureSchema.virtual("ruleCount").get(function () {
  return Array.isArray(this.rules) ? this.rules.length : 0;
});

salaryStructureSchema.methods.toJSON = function () {
  const obj = this.toObject({ virtuals: true });
  delete obj.__v;
  return obj;
};

const SalaryStructure = mongoose.model("SalaryStructure", salaryStructureSchema);
module.exports = SalaryStructure;
