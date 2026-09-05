const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const ROLES = [
  "Admin",
  "HR Manager",
  "HR Payroll User",
  "HR Payroll Manager",
  "Employee",
];

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, "Password hash is required"],
    },
    roles: {
      type: [String],
      required: [true, "At least one role is required"],
      validate: {
        validator: function (val) {
          return Array.isArray(val) && val.length > 0 && val.every((r) => ROLES.includes(r));
        },
        message: `Roles must be an array with at least one valid role from: ${ROLES.join(", ")}`,
      },
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for setting plain password
userSchema.virtual("password").set(function (plainPassword) {
  this._plainPassword = plainPassword;
});

// Pre-validate hook: hash password if virtual password is provided
userSchema.pre("validate", async function () {
  if (this._plainPassword) {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this._plainPassword, salt);
    this._plainPassword = undefined;
  }
});

// Instance method to compare candidate password against passwordHash
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Static helper to hash passwords directly
userSchema.statics.hashPassword = async function (plainPassword) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
};

// Ensure passwordHash is omitted when converted to JSON
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.passwordHash;
  delete userObject.__v;
  return userObject;
};

userSchema.statics.ROLES = ROLES;

const User = mongoose.model("User", userSchema);
module.exports = User;
