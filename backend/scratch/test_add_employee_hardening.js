const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const User = require("../src/models/User");
const Employee = require("../src/models/Employee");
require("../src/models/Department");
require("../src/models/JobPosition");
require("../src/models/WorkingSchedule");
const userService = require("../src/services/user.service");
const employeeService = require("../src/services/employee.service");

async function runHardeningTests() {
  console.log("==================================================");
  console.log("STARTING ADD EMPLOYEE HARDENING INTEGRATION TESTS");
  console.log("==================================================");

  await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/peoplepay360_db");
  console.log("Connected to MongoDB");

  let passed = 0;
  let failed = 0;

  function assert(cond, desc) {
    if (cond) {
      console.log(`  ✓ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${desc}`);
      failed++;
    }
  }

  const createdUsers = [];
  const createdEmployees = [];

  try {
    // ----------------------------------------------------
    // TEST 3 & READ-ONLY GUARANTEE: Search non-existing User
    // ----------------------------------------------------
    console.log("\n--- Testing Search Read-Only & Non-Existing User ---");
    const userCountBefore = await User.countDocuments();
    const empCountBefore = await Employee.countDocuments();

    const nonExistentResult = await userService.lookupByEmail("nonexistent_user_xyz@test.com");
    const userCountAfter = await User.countDocuments();
    const empCountAfter = await Employee.countDocuments();

    assert(
      nonExistentResult.found === false && nonExistentResult.status === "USER_NOT_FOUND",
      "TEST 3: Non-existing user search returns status USER_NOT_FOUND and found=false"
    );
    assert(
      userCountBefore === userCountAfter && empCountBefore === empCountAfter,
      "READ-ONLY GUARANTEE: Searching did NOT create, update, or delete any DB records"
    );

    // ----------------------------------------------------
    // TEST 5 & 13: Search existing user NOT linked to employee & Case Insensitivity
    // ----------------------------------------------------
    console.log("\n--- Testing Existing User Lookup & Email Normalization ---");
    const availableUserEmail = `avail_user_${Date.now()}@example.com`;
    const availUser = await User.create({
      fullName: "Available Test User",
      email: availableUserEmail,
      password: "Password123!",
      roles: ["Employee"],
      isActive: true,
    });
    createdUsers.push(availUser);

    // Search lowercase
    const availResult1 = await userService.lookupByEmail(availableUserEmail);
    assert(
      availResult1.found === true &&
        availResult1.status === "USER_AVAILABLE" &&
        availResult1.isAlreadyEmployee === false &&
        availResult1.user.fullName === "Available Test User",
      "TEST 5: Search existing user not linked returns status USER_AVAILABLE"
    );

    // TEST 13: Search uppercase / mixed case
    const availResult2 = await userService.lookupByEmail(availableUserEmail.toUpperCase());
    assert(
      availResult2.found === true &&
        availResult2.status === "USER_AVAILABLE" &&
        String(availResult2.user.id) === String(availUser._id),
      "TEST 13: Search with uppercase email finds the normalized user account correctly"
    );

    // ----------------------------------------------------
    // TEST 6: Search user ALREADY linked to employee
    // ----------------------------------------------------
    console.log("\n--- Testing User Already Linked to Employee ---");
    const linkedUserEmail = `linked_user_${Date.now()}@example.com`;
    const userForLink = await User.create({
      fullName: "Already Linked User",
      email: linkedUserEmail,
      password: "Password123!",
      roles: ["Employee"],
      isActive: true,
    });
    createdUsers.push(userForLink);

    const empLinked = await employeeService.create({
      fullName: userForLink.fullName,
      email: userForLink.email,
      linkUserId: userForLink._id,
    });
    createdEmployees.push(empLinked);

    const alreadyEmpResult = await userService.lookupByEmail(linkedUserEmail);
    assert(
      alreadyEmpResult.found === true &&
        alreadyEmpResult.status === "ALREADY_EMPLOYEE" &&
        alreadyEmpResult.isAlreadyEmployee === true &&
        alreadyEmpResult.employee &&
        alreadyEmpResult.employee.employeeCode === empLinked.employeeCode,
      "TEST 6: Search user already linked returns status ALREADY_EMPLOYEE with employee details"
    );

    // ----------------------------------------------------
    // TEST 7: Data Inconsistency Handling
    // ----------------------------------------------------
    console.log("\n--- Testing Data Inconsistency Detection ---");
    // Create a user whose .employee points to a non-existent ObjectId
    const fakeEmpId = new mongoose.Types.ObjectId();
    const inconsistentUser = await User.create({
      fullName: "Inconsistent User",
      email: `inconsistent_${Date.now()}@example.com`,
      password: "Password123!",
      roles: ["Employee"],
      employee: fakeEmpId,
      isActive: true,
    });
    createdUsers.push(inconsistentUser);

    const inconsistencyResult = await userService.lookupByEmail(inconsistentUser.email);
    assert(
      inconsistencyResult.found === true &&
        inconsistencyResult.status === "EMPLOYEE_LINK_INCONSISTENCY" &&
        inconsistencyResult.isAlreadyEmployee === true,
      "TEST 7: User with dangling employee ID returns status EMPLOYEE_LINK_INCONSISTENCY"
    );

    // ----------------------------------------------------
    // TEST 8 & 14: Manual Entry with Existing Employee Email (Duplicate Conflict)
    // ----------------------------------------------------
    console.log("\n--- Testing Duplicate Employee Email Conflict ---");
    let duplicateRejected = false;
    let conflictCode = "";
    try {
      await employeeService.create({
        fullName: "Duplicate Email Attempt",
        email: empLinked.email.toUpperCase(), // TEST 14: case insensitive collision check
      });
    } catch (err) {
      duplicateRejected = true;
      conflictCode = err.code;
    }

    assert(
      duplicateRejected && (conflictCode === "EMPLOYEE_EMAIL_EXISTS" || conflictCode === 11000),
      "TEST 8 & 14: Creating employee with existing email is rejected with 409 conflict and normalized"
    );

    // ----------------------------------------------------
    // TEST 10: Manual Entry with Completely New Email
    // ----------------------------------------------------
    console.log("\n--- Testing Manual Entry with New Email ---");
    const freshEmail = `fresh_manual_${Date.now()}@example.com`;
    const freshEmp = await employeeService.create({
      fullName: "Fresh Manual Employee",
      email: freshEmail,
    });
    createdEmployees.push(freshEmp);

    assert(
      freshEmp && freshEmp.employeeCode && freshEmp.email === freshEmail.toLowerCase(),
      "TEST 10: Fresh manual employee created successfully with auto code"
    );

    // ----------------------------------------------------
    // TEST 12: Concurrent Simultaneous Creation Requests
    // ----------------------------------------------------
    console.log("\n--- Testing Concurrent Creation Race Condition Handling ---");
    const concurrentEmail = `race_condition_${Date.now()}@example.com`;
    let successCount = 0;
    let conflictCount = 0;

    const results = await Promise.allSettled([
      employeeService.create({
        fullName: "Race Contender 1",
        email: concurrentEmail,
      }),
      employeeService.create({
        fullName: "Race Contender 2",
        email: concurrentEmail,
      }),
    ]);

    for (const r of results) {
      if (r.status === "fulfilled") {
        successCount++;
        createdEmployees.push(r.value);
      } else if (r.status === "rejected") {
        conflictCount++;
      }
    }

    assert(
      successCount === 1 && conflictCount === 1,
      `TEST 12: Race condition safely resolved: 1 created, 1 rejected with conflict (success=${successCount}, conflict=${conflictCount})`
    );
  } finally {
    // Clean up temporary records
    console.log("\n--- Cleaning up temporary test records ---");
    for (const emp of createdEmployees) {
      if (emp?._id) await Employee.findByIdAndDelete(emp._id);
    }
    for (const usr of createdUsers) {
      if (usr?._id) await User.findByIdAndDelete(usr._id);
    }
    console.log("Cleanup complete.");
  }

  console.log("\n==================================================");
  console.log(`TEST SUMMARY: ${passed} passed, ${failed} failed`);
  console.log("==================================================");

  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

runHardeningTests().catch((err) => {
  console.error("Hardening test run error:", err);
  process.exit(1);
});
