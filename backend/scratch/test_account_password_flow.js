const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("../src/models/Department");
require("../src/models/JobPosition");
require("../src/models/WorkingSchedule");
const User = require("../src/models/User");
const Employee = require("../src/models/Employee");
const employeeService = require("../src/services/employee.service");
const userService = require("../src/services/user.service");

const MONGO_URI = "mongodb://127.0.0.1:27017/peoplepay360_db";

async function runTests() {
  console.log("==================================================");
  console.log("STARTING TEST SUITE: Account & Password Management");
  console.log("==================================================");

  await mongoose.connect(MONGO_URI);
  console.log("✓ Connected to MongoDB");

  const timestamp = Date.now();
  const testEmails = {
    existingUser: `test_exist_${timestamp}@company.com`,
    manualEmp: `test_manual_${timestamp}@company.com`,
    conflictUser: `test_conflict_${timestamp}@company.com`,
  };

  try {
    // ----------------------------------------------------
    // TEST 1: Existing registered user -> Find Existing User -> Link to Employee -> Password still works
    // ----------------------------------------------------
    console.log("\n--- TEST 1: Existing User Linking Flow ---");
    const originalPassword = "OriginalPass123!";
    const userDoc = await userService.createUser({
      fullName: "Existing Registered User",
      email: testEmails.existingUser,
      password: originalPassword,
      roles: ["Employee"],
    });
    console.log(`✓ Created test User: ${userDoc.email} (_id: ${userDoc._id})`);

    // Lookup user
    const lookupRes = await userService.lookupByEmail(testEmails.existingUser);
    if (!lookupRes.found || lookupRes.isAlreadyEmployee) {
      throw new Error(`Lookup failed: ${JSON.stringify(lookupRes)}`);
    }
    console.log("✓ Lookup returned USER_AVAILABLE");

    // Link user to new Employee
    const empFromUser = await employeeService.create({
      fullName: userDoc.fullName,
      email: userDoc.email,
      linkUserId: userDoc._id,
      employeeType: "Full-Time",
      status: "Active",
    });
    console.log(`✓ Created Employee linked to User: ${empFromUser.employeeCode} (_id: ${empFromUser._id})`);

    // Verify User record is linked and password still works
    const linkedUserCheck = await User.findById(userDoc._id);
    if (String(linkedUserCheck.employee) !== String(empFromUser._id)) {
      throw new Error("User.employee was not linked properly");
    }
    const isPassValid = await linkedUserCheck.comparePassword(originalPassword);
    if (!isPassValid) {
      throw new Error("Existing user password was altered or corrupted!");
    }
    console.log("✓ User password remained intact and comparePassword succeeded");

    // ----------------------------------------------------
    // TEST 2: Manual Employee Entry with Password -> Employee can log in
    // ----------------------------------------------------
    console.log("\n--- TEST 2: Manual Employee with Login Account ---");
    const manualPassword = "ManualEmpPass2026#";
    const manualEmp = await employeeService.create({
      fullName: "Manual Created Employee",
      email: testEmails.manualEmp,
      password: manualPassword,
      phone: "1234567890",
      employeeType: "Full-Time",
      status: "Active",
    });
    console.log(`✓ Created Manual Employee: ${manualEmp.fullName} (${manualEmp.employeeCode})`);

    // Verify linked User was automatically created
    const manualUser = await User.findOne({ email: testEmails.manualEmp });
    if (!manualUser) {
      throw new Error("User account was not created for manual employee");
    }
    if (String(manualUser.employee) !== String(manualEmp._id)) {
      throw new Error("Manual User.employee does not match Employee._id");
    }
    const isManualPassValid = await manualUser.comparePassword(manualPassword);
    if (!isManualPassValid) {
      throw new Error("Manual employee password hash does not authenticate with entered password!");
    }
    console.log("✓ Manual employee User created and login authentication verified");

    // ----------------------------------------------------
    // TEST 3: Manual Employee with existing User email -> Rejection / Switch prompt
    // ----------------------------------------------------
    console.log("\n--- TEST 3: Duplicate User Email Conflict ---");
    let test3Failed = false;
    try {
      await employeeService.create({
        fullName: "Duplicate User Name",
        email: testEmails.existingUser,
        password: "ValidPass1234#",
      });
      test3Failed = true;
    } catch (err) {
      if (err.code !== "USER_EMAIL_EXISTS" && err.code !== "EMPLOYEE_EMAIL_EXISTS" && err.statusCode !== 409) {
        throw new Error(`Unexpected error code for duplicate email: ${err.message}`);
      }
      console.log(`✓ Caught expected conflict error: ${err.message} (code: ${err.code})`);
    }
    if (test3Failed) {
      throw new Error("Duplicate user email did not throw error!");
    }

    // ----------------------------------------------------
    // TEST 4: Manual Employee with existing Employee email -> Rejection
    // ----------------------------------------------------
    console.log("\n--- TEST 4: Duplicate Employee Email Conflict ---");
    let test4Failed = false;
    try {
      await employeeService.create({
        fullName: "Another Person Same Email",
        email: testEmails.manualEmp,
        password: "ValidPass1234#",
      });
      test4Failed = true;
    } catch (err) {
      if (err.code !== "EMPLOYEE_EMAIL_EXISTS" && err.code !== "USER_EMAIL_EXISTS" && err.statusCode !== 409) {
        throw new Error(`Unexpected error code for duplicate employee email: ${err.message}`);
      }
      console.log(`✓ Caught expected duplicate employee error: ${err.message}`);
    }
    if (test4Failed) {
      throw new Error("Duplicate employee email did not throw error!");
    }

    // ----------------------------------------------------
    // TEST 5: Password validation rules (< 8 chars)
    // ----------------------------------------------------
    console.log("\n--- TEST 5: Password Length Validation (< 8 chars) ---");
    let test5Failed = false;
    try {
      await employeeService.create({
        fullName: "Short Pass Employee",
        email: `short_pass_${timestamp}@company.com`,
        password: "short",
      });
      test5Failed = true;
    } catch (err) {
      console.log(`✓ Short password rejected: ${err.message}`);
    }
    if (test5Failed) {
      throw new Error("Short password was accepted!");
    }

    // ----------------------------------------------------
    // TEST 6: Normal Employee Details Edit
    // ----------------------------------------------------
    console.log("\n--- TEST 6: Normal Details Update ---");
    const updatedEmp = await employeeService.update(manualEmp._id, {
      fullName: "Manual Employee (Updated)",
      phone: "9876543210",
      status: "Active",
    });
    if (updatedEmp.fullName !== "Manual Employee (Updated)") {
      throw new Error("Employee full name was not updated");
    }
    const syncedUser = await User.findOne({ email: testEmails.manualEmp });
    if (syncedUser.fullName !== "Manual Employee (Updated)") {
      throw new Error("User full name did not synchronize with Employee update");
    }
    console.log("✓ Normal details update saved and synchronized with User model");

    // ----------------------------------------------------
    // TEST 7: Admin Changes Password
    // ----------------------------------------------------
    console.log("\n--- TEST 7: Admin Changes Password ---");
    const newPassword = "NewSecretPassword2026!";
    await employeeService.updatePassword(manualEmp._id, newPassword);

    const userAfterPassChange = await User.findOne({ email: testEmails.manualEmp });
    const isOldPassWorking = await userAfterPassChange.comparePassword(manualPassword);
    const isNewPassWorking = await userAfterPassChange.comparePassword(newPassword);

    if (isOldPassWorking) {
      throw new Error("Old password still authenticates after password change!");
    }
    if (!isNewPassWorking) {
      throw new Error("New password fails authentication after password change!");
    }
    console.log("✓ Password update verified: old password invalidated, new password authenticates");

    // ----------------------------------------------------
    // TEST 8: Password never stored in Employee or in plain text
    // ----------------------------------------------------
    console.log("\n--- TEST 8: Security Audit (No Plaintext Passwords) ---");
    const rawEmp = await Employee.findById(manualEmp._id).lean();
    if (rawEmp.password || rawEmp.plainPassword || rawEmp.passwordHash) {
      throw new Error("Employee document contains password fields!");
    }
    const rawUser = await User.findById(manualUser._id).lean();
    if (rawUser.password || rawUser.plainPassword || rawUser.passwordHash === newPassword) {
      throw new Error("User document contains plain text passwords!");
    }
    if (!rawUser.passwordHash || !rawUser.passwordHash.startsWith("$2")) {
      throw new Error("User passwordHash is not a valid bcrypt hash!");
    }
    console.log("✓ Security verified: Employee record has no password fields, User passwordHash is standard bcrypt hash");

    console.log("\n==================================================");
    console.log("ALL 8 VERIFICATION TESTS PASSED SUCCESSFULLY! ✓");
    console.log("==================================================");
  } finally {
    // Cleanup test records
    await Employee.deleteMany({ email: { $in: Object.values(testEmails) } });
    await User.deleteMany({ email: { $in: Object.values(testEmails) } });
    console.log("✓ Cleaned up test records from database");
    await mongoose.disconnect();
  }
}

runTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
