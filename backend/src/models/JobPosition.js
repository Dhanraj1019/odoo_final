const mongoose = require("mongoose");

const jobPositionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Job position name is required"],
      unique: true,
      trim: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

jobPositionSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

const JobPosition = mongoose.model("JobPosition", jobPositionSchema);
module.exports = JobPosition;
