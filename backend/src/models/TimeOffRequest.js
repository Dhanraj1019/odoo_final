const mongoose = require("mongoose");

/**
 * TimeOffRequest Model
 * Tracks leave requests submitted by employees and actioned by managers/HR.
 * Specification: 06-DATABASE-DESIGN.md §11 & 14-TIME-OFF-MANAGEMENT.md §6
 */
const timeOffRequestSchema = new mongoose.Schema(
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
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },
    duration: {
      type: Number,
      required: [true, "Duration is required"],
      min: [0, "Duration cannot be negative"],
    },
    status: {
      type: String,
      enum: {
        values: ["Submitted", "Approved", "Refused"],
        message: "{VALUE} is not a valid request status",
      },
      default: "Submitted",
      index: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    actionedAt: {
      type: Date,
      default: null,
    },
    reason: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

timeOffRequestSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

const TimeOffRequest = mongoose.model("TimeOffRequest", timeOffRequestSchema);
module.exports = TimeOffRequest;
