const mongoose = require("mongoose");

/**
 * Attendance Model
 * Represents daily attendance records per employee.
 * Specification: 06-DATABASE-DESIGN.md §8 & 13-ATTENDANCE-MANAGEMENT.md
 */
const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "Employee reference is required"],
      index: true,
    },
    date: {
      type: Date,
      required: [true, "Attendance date is required"],
    },
    checkIn: {
      type: Date,
      default: null,
    },
    checkOut: {
      type: Date,
      default: null,
    },
    workedHours: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: {
        values: ["Present", "Late", "Absent", "On Leave", "Half Day"],
        message: "{VALUE} is not a valid attendance status",
      },
      default: "Present",
    },
    isManualCorrection: {
      type: Boolean,
      default: false,
    },
    correctedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index: one attendance record per employee per calendar date
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1 });

attendanceSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

const Attendance = mongoose.model("Attendance", attendanceSchema);
module.exports = Attendance;
