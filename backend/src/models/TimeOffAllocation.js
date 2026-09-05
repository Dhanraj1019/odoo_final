const mongoose = require("mongoose");

/**
 * TimeOffAllocation Model
 * Tracks allocated vs taken leave quota per employee per leave type.
 * Specification: 06-DATABASE-DESIGN.md §10 & 14-TIME-OFF-MANAGEMENT.md §5
 */
const timeOffAllocationSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "Employee reference is required"],
      index: true,
    },
    timeOffType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TimeOffType",
      required: [true, "TimeOffType reference is required"],
      index: true,
    },
    allocatedAmount: {
      type: Number,
      required: [true, "Allocated amount is required"],
      min: [0, "Allocated amount cannot be negative"],
    },
    takenAmount: {
      type: Number,
      default: 0,
      min: [0, "Taken amount cannot be negative"],
    },
    validFrom: {
      type: Date,
      default: null,
    },
    validTo: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: ["Pending Approval", "Approved", "Expired"],
        message: "{VALUE} is not a valid allocation status",
      },
      default: "Pending Approval",
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for remaining leave balance
timeOffAllocationSchema.virtual("remainingAmount").get(function () {
  const allocated = typeof this.allocatedAmount === "number" ? this.allocatedAmount : 0;
  const taken = typeof this.takenAmount === "number" ? this.takenAmount : 0;
  return Math.max(0, allocated - taken);
});

timeOffAllocationSchema.methods.toJSON = function () {
  const obj = this.toObject({ virtuals: true });
  delete obj.__v;
  return obj;
};

const TimeOffAllocation = mongoose.model("TimeOffAllocation", timeOffAllocationSchema);
module.exports = TimeOffAllocation;
