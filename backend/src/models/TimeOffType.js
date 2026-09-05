const mongoose = require("mongoose");

/**
 * TimeOffType Model
 * Represents leave categories (e.g. Paid Time Off, Sick Leave, Unpaid Leave)
 * Specification: 06-DATABASE-DESIGN.md §9 & 14-TIME-OFF-MANAGEMENT.md §4
 */
const timeOffTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Time off type name is required"],
      unique: true,
      trim: true,
    },
    unit: {
      type: String,
      enum: {
        values: ["Days", "Hours"],
        message: "{VALUE} is not a valid time off unit",
      },
      default: "Days",
      required: true,
    },
    requiresAllocation: {
      type: Boolean,
      default: true,
    },
    requiresApproval: {
      type: Boolean,
      default: true,
    },
    affectsPayroll: {
      type: Boolean,
      default: true,
    },
    isPaid: {
      type: Boolean,
      default: true,
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

timeOffTypeSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

const TimeOffType = mongoose.model("TimeOffType", timeOffTypeSchema);
module.exports = TimeOffType;
