const mongoose = require("mongoose");
require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
require("../src/models/Department");
require("../src/models/JobPosition");
require("../src/models/WorkingSchedule");
const employeeService = require("../src/services/employee.service");
const User = require("../src/models/User");
const Employee = require("../src/models/Employee");

const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/peoplepay360_db";

async function runTest() {
  console.log("==================================================");
  console.log("   TODO 2 VERIFICATION: EMPLOYEE / USER LINKING   ");
  console.log("==================================================");

  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB.");

  const ts = Date.now();
  const createdUserIds = [];
  const createdEmpIds = [];

  try {
    // 1. Standalone employee creation test (no linkUserId)
    console.log("\n[Test 1] Standalone Employee creation without linkUserId...");
    const emp1 = await employeeService.create({
      fullName: "Standalone Employee",
      employeeCode: `EMP-${ts.toString().slice(-4)}1`,
      email: `standalone_${ts}@example.com`,
      status: "Active",
    });
    createdEmpIds.push(emp1._id);
    if (!emp1 || emp1.fullName !== "Standalone Employee") {
      throw new Error("Test 1 Failed: Standalone employee was not created");
    }
    console.log("✓ Test 1 Passed: Standalone Employee creation succeeds normally (backward-compatible).");

    // 2. Valid Employee creation with unlinked User
    console.log("\n[Test 2] Employee creation with active unlinked User...");
    const user2 = await User.create({
      fullName: "Valid Link User",
      email: `valid_user_${ts}@example.com`,
      password: "TestPassword123!",
      roles: ["Employee"],
      isActive: true,
      employee: null,
    });
    createdUserIds.push(user2._id);

    const emp2 = await employeeService.create({
      fullName: "Valid Link User",
      employeeCode: `EMP-${ts.toString().slice(-4)}2`,
      email: `valid_user_${ts}@example.com`,
      status: "Active",
      linkUserId: user2._id,
    });
    createdEmpIds.push(emp2._id);

    const checkUser2 = await User.findById(user2._id);
    if (!checkUser2.employee || String(checkUser2.employee) !== String(emp2._id)) {
      throw new Error(`Test 2 Failed: User.employee was not linked to Employee ID ${emp2._id}`);
    }
    console.log(`✓ Test 2 Passed: User.employee successfully linked to Employee ${emp2._id}.`);

    // 3. Rejection when attempting to link an already-linked User
    console.log("\n[Test 3] Reject when attempting to link an ALREADY-LINKED User...");
    let test3Failed = false;
    try {
      await employeeService.create({
        fullName: "Another Employee",
        employeeCode: `EMP-${ts.toString().slice(-4)}3`,
        email: `another_${ts}@example.com`,
        status: "Active",
        linkUserId: user2._id, // user2 is already linked to emp2!
      });
      test3Failed = true;
    } catch (err) {
      if (err.statusCode !== 409) {
        throw new Error(`Test 3 Expected status 409, got ${err.statusCode}: ${err.message}`);
      }
      console.log(`✓ Test 3 Passed: Correctly rejected with 409 Conflict: "${err.message}"`);
    }
    if (test3Failed) throw new Error("Test 3 Failed: Server allowed linking an already-linked User!");

    // 4. Rejection when attempting to link an INACTIVE User
    console.log("\n[Test 4] Reject when attempting to link an INACTIVE User...");
    const inactiveUser = await User.create({
      fullName: "Inactive Link User",
      email: `inactive_user_${ts}@example.com`,
      password: "TestPassword123!",
      roles: ["Employee"],
      isActive: false,
      employee: null,
    });
    createdUserIds.push(inactiveUser._id);

    let test4Failed = false;
    try {
      await employeeService.create({
        fullName: "Inactive Employee",
        employeeCode: `EMP-${ts.toString().slice(-4)}4`,
        email: `inactive_emp_${ts}@example.com`,
        status: "Active",
        linkUserId: inactiveUser._id,
      });
      test4Failed = true;
    } catch (err) {
      if (err.statusCode !== 400 && err.statusCode !== 409) {
        throw new Error(`Test 4 Expected status 400/409, got ${err.statusCode}: ${err.message}`);
      }
      console.log(`✓ Test 4 Passed: Correctly rejected inactive user link: "${err.message}"`);
    }
    if (test4Failed) throw new Error("Test 4 Failed: Server allowed linking an inactive User!");

    // 5. Rejection when linkUserId does not exist
    console.log("\n[Test 5] Reject when linkUserId does not exist...");
    let test5Failed = false;
    const fakeId = new mongoose.Types.ObjectId();
    try {
      await employeeService.create({
        fullName: "Fake User Employee",
        employeeCode: `EMP-${ts.toString().slice(-4)}5`,
        email: `fake_emp_${ts}@example.com`,
        status: "Active",
        linkUserId: fakeId,
      });
      test5Failed = true;
    } catch (err) {
      if (err.statusCode !== 404) {
        throw new Error(`Test 5 Expected status 404, got ${err.statusCode}: ${err.message}`);
      }
      console.log(`✓ Test 5 Passed: Correctly rejected non-existent user link with 404: "${err.message}"`);
    }
    if (test5Failed) throw new Error("Test 5 Failed: Server allowed non-existent linkUserId!");

    // 6. Duplicate Employee Email Rejection
    console.log("\n[Test 6] Reject duplicate Employee email...");
    let test6Failed = false;
    try {
      await employeeService.create({
        fullName: "Duplicate Email Employee",
        employeeCode: `EMP-${ts.toString().slice(-4)}6`,
        email: `valid_user_${ts}@example.com`, // Already used by emp2
        status: "Active",
      });
      test6Failed = true;
    } catch (err) {
      if (err.statusCode !== 409) {
        throw new Error(`Test 6 Expected status 409, got ${err.statusCode}: ${err.message}`);
      }
      console.log(`✓ Test 6 Passed: Correctly rejected duplicate Employee email with 409: "${err.message}"`);
    }
    if (test6Failed) throw new Error("Test 6 Failed: Server allowed duplicate Employee email!");

    // 7. Cleanup
    await User.deleteMany({ _id: { $in: createdUserIds } });
    await Employee.deleteMany({ _id: { $in: createdEmpIds } });
    console.log("\n✓ Test data cleanup completed.");

    console.log("\n==================================================");
    console.log("   ALL TODO 2 ASSERTIONS PASSED SUCCESSFULLY!    ");
    console.log("==================================================");
  } catch (err) {
    console.error("Test failed with error:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runTest();
