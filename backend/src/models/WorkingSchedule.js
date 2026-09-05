const mongoose = require("mongoose");

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const parseTimeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== "string") return 0;
  const parts = timeStr.split(":");
  if (parts.length !== 2) return 0;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return 0;
  return hours * 60 + minutes;
};

const dayScheduleSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: DAYS_OF_WEEK,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
      default: "09:00",
    },
    endTime: {
      type: String,
      required: true,
      default: "18:00",
    },
    breakMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const workingScheduleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Working schedule name is required"],
      unique: true,
      trim: true,
    },
    company: {
      type: String,
      default: "My Company",
      trim: true,
    },
    days: {
      type: [dayScheduleSchema],
      default: [],
    },
    totalWeeklyHours: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Active", "Archived"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook: compute total weekly hours automatically from daily grid
// Specification: 12-WORKING-SCHEDULE.md §4
workingScheduleSchema.pre("save", function () {
  if (Array.isArray(this.days)) {
    const totalMinutes = this.days.reduce((sum, d) => {
      const start = parseTimeToMinutes(d.startTime);
      const end = parseTimeToMinutes(d.endTime);
      const worked = Math.max(0, end - start - (d.breakMinutes || 0));
      return sum + worked;
    }, 0);
    this.totalWeeklyHours = Number((totalMinutes / 60).toFixed(2));
  } else {
    this.totalWeeklyHours = 0;
  }
});

workingScheduleSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

workingScheduleSchema.statics.DAYS_OF_WEEK = DAYS_OF_WEEK;

const WorkingSchedule = mongoose.model("WorkingSchedule", workingScheduleSchema);
module.exports = WorkingSchedule;
