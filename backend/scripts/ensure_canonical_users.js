const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

async function seedEmployeeUser() {
  await mongoose.connect(process.env.MONGODB_URI);
  const User = mongoose.connection.db.collection("users");
  const Employee = mongoose.connection.db.collection("employees");

  const emp10 = await Employee.findOne({ email: "employee@peoplepay360.local" });
  if (emp10) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash("Employee2026!", salt);
    await User.updateOne(
      { email: "employee@peoplepay360.local" },
      {
        $set: {
          fullName: emp10.fullName,
          email: "employee@peoplepay360.local",
          passwordHash: passwordHash,
          roles: ["Employee"],
          employee: emp10._id,
          isActive: true,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );
    console.log("✓ Canonical employee user provisioned successfully");
  }
  process.exit(0);
}
seedEmployeeUser();
