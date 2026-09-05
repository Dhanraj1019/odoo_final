require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const connectDB = require("../config/db");

const seedAdmin = async () => {
  try {
    await connectDB();

    const adminEmail = process.env.ADMIN_SEED_EMAIL || "admin@peoplepay360.local";
    const adminPassword = process.env.ADMIN_SEED_PASSWORD || "AdminPassword2026!";
    const adminName = process.env.ADMIN_SEED_NAME || "System Administrator";

    let admin = await User.findOne({ email: adminEmail.toLowerCase() });

    if (admin) {
      admin.fullName = adminName;
      admin.roles = ["Admin"];
      admin.isActive = true;
      admin.password = adminPassword;
      await admin.save();
      console.log(`[Seed] Bootstrap Admin user updated: ${admin.email}`);
    } else {
      admin = new User({
        fullName: adminName,
        email: adminEmail,
        roles: ["Admin"],
        isActive: true,
        password: adminPassword,
      });
      await admin.save();
      console.log(`[Seed] Bootstrap Admin user created: ${admin.email}`);
    }

    console.log(`[Seed] Admin Email: ${admin.email}`);
    console.log(`[Seed] Admin Roles: ${JSON.stringify(admin.roles)}`);
    process.exit(0);
  } catch (error) {
    console.error(`[Seed] Error seeding Admin:`, error);
    process.exit(1);
  }
};

seedAdmin();
