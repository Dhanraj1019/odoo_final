const mongoose = require("mongoose");
require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const userService = require("../src/services/user.service");
const User = require("../src/models/User");
const Employee = require("../src/models/Employee");

const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/peoplepay360_db";

async function runTest() {
  console.log("==================================================");
  console.log("   TODO 1 VERIFICATION: USER LOOKUP BY EMAIL      ");
  console.log("==================================================");

  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB.");

  const ts = Date.now();
  const unlinkedEmail = `unlinked_${ts}@example.com`;
  const linkedEmail = `linked_${ts}@example.com`;
  const inactiveEmail = `inactive_${ts}@example.com`;
  const nonExistentEmail = `nonexistent_${ts}@example.com`;

  try {
    // Setup dummy employee for linked test
    const dummyEmp = await Employee.create({
      fullName: "Dummy Linked Employee",
      employeeCode: `EMP-${ts.toString().slice(-4)}`,
      email: linkedEmail,
      status: "Active",
    });

    // Setup unlinked user
    const unlinkedUser = await User.create({
      fullName: "Unlinked User",
      email: unlinkedEmail,
      password: "TestPassword123!",
      roles: ["Employee"],
      isActive: true,
      employee: null,
    });

    // Setup linked user
    const linkedUser = await User.create({
      fullName: "Linked User",
      email: linkedEmail,
      password: "TestPassword123!",
      roles: ["Employee"],
      isActive: true,
      employee: dummyEmp._id,
    });

    // Setup inactive user
    const inactiveUser = await User.create({
      fullName: "Inactive User",
      email: inactiveEmail,
      password: "TestPassword123!",
      roles: ["Employee"],
      isActive: false,
      employee: null,
    });

    console.log("\n[Test 1] Lookup unlinked active user (with uppercase and whitespace)...");
    const res1 = await userService.lookupByEmail(`  ${unlinkedEmail.toUpperCase()} `);
    console.log("Result 1:", JSON.stringify(res1));
    if (res1.status !== "UNLINKED" || !res1.user || res1.user.fullName !== "Unlinked User") {
      throw new Error(`Test 1 Failed: Expected UNLINKED, got ${res1.status}`);
    }
    console.log("✓ Test 1 Passed: Correctly returned UNLINKED status with safe user fields.");

    console.log("\n[Test 2] Lookup linked user...");
    const res2 = await userService.lookupByEmail(linkedEmail);
    console.log("Result 2:", JSON.stringify(res2));
    if (res2.status !== "ALREADY_LINKED" || !res2.linkedEmployeeId || !res2.employeeExists) {
      throw new Error(`Test 2 Failed: Expected ALREADY_LINKED, got ${res2.status}`);
    }
    console.log("✓ Test 2 Passed: Correctly returned ALREADY_LINKED and employeeExists=true.");

    console.log("\n[Test 3] Lookup inactive user...");
    const res3 = await userService.lookupByEmail(inactiveEmail);
    console.log("Result 3:", JSON.stringify(res3));
    if (res3.status !== "INACTIVE") {
      throw new Error(`Test 3 Failed: Expected INACTIVE, got ${res3.status}`);
    }
    console.log("✓ Test 3 Passed: Correctly returned INACTIVE status.");

    console.log("\n[Test 4] Lookup nonexistent email...");
    const res4 = await userService.lookupByEmail(nonExistentEmail);
    console.log("Result 4:", JSON.stringify(res4));
    if (res4.status !== "NOT_FOUND" || res4.user !== null || res4.employeeExists) {
      throw new Error(`Test 4 Failed: Expected NOT_FOUND, got ${res4.status}`);
    }
    console.log("✓ Test 4 Passed: Correctly returned NOT_FOUND status.");

    console.log("\n[Test 5] Verify passwordHash is NOT leaked...");
    if (res1.user.passwordHash || res1.user.password || res1.user._plainPassword) {
      throw new Error("Test 5 Failed: Security violation - password field leaked in lookup!");
    }
    console.log("✓ Test 5 Passed: No sensitive authentication data leaked.");

    // Cleanup
    await User.deleteMany({ _id: { $in: [unlinkedUser._id, linkedUser._id, inactiveUser._id] } });
    await Employee.deleteMany({ _id: dummyEmp._id });
    console.log("\n✓ Test cleanup completed.");

    console.log("\n==================================================");
    console.log("   ALL TODO 1 ASSERTIONS PASSED SUCCESSFULLY!    ");
    console.log("==================================================");
  } catch (err) {
    console.error("Test failed with error:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runTest();
