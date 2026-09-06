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

async function verifyRelationship() {
  console.log("==========================================================");
  console.log("VERIFYING USER ↔ EMPLOYEE RELATIONSHIP & IMPLEMENTATION");
  console.log("==========================================================");

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

  // ----------------------------------------------------
  // STEP 1: INSPECT ACTUAL SCHEMA TYPES
  // ----------------------------------------------------
  console.log("\n--- Step 1: Schema Type Inspection ---");
  const employeePath = User.schema.path("employee");
  console.log("User.schema.path('employee').instance:", employeePath.instance);
  console.log("User.schema.path('employee').options.ref:", employeePath.options?.ref);

  assert(
    employeePath.instance === "ObjectID" || employeePath.instance === "ObjectId",
    `User.employee type is ObjectId (found: ${employeePath.instance})`
  );
  assert(
    employeePath.options?.ref === "Employee",
    `User.employee references 'Employee' model (found: ${employeePath.options?.ref})`
  );
  assert(
    employeePath.instance !== "Boolean",
    "User.employee is NOT a Boolean"
  );

  const createdUsers = [];
  const createdEmployees = [];

  try {
    // ----------------------------------------------------
    // STEP 2: REGISTERED USER → CREATE EMPLOYEE FLOW
    // ----------------------------------------------------
    console.log("\n--- Step 2: Registered User → Create Employee Flow ---");
    const testUserEmail = `verified_user_${Date.now()}@example.com`;
    const userDoc = await User.create({
      fullName: "Verified Relational User",
      email: testUserEmail,
      password: "Password123!",
      roles: ["Employee"],
      isActive: true,
      employee: null,
    });
    createdUsers.push(userDoc);

    // Initial check: user.employee should be null
    assert(userDoc.employee === null, "Initial User document has employee: null");

    // Create Employee linked to this User
    const createdEmp = await employeeService.create({
      fullName: userDoc.fullName,
      email: userDoc.email,
      linkUserId: userDoc._id,
    });
    createdEmployees.push(createdEmp);

    // Verify Employee in Employee collection
    const fetchedEmp = await Employee.findById(createdEmp._id);
    assert(
      fetchedEmp !== null && fetchedEmp._id.toString() === createdEmp._id.toString(),
      `Employee document exists in Employee collection with ID ${fetchedEmp._id}`
    );

    // Verify User in Users collection has employee pointing to Employee ObjectId
    const rawUserDoc = await mongoose.connection.collection("users").findOne({ _id: userDoc._id });
    console.log("Raw User record in DB:", {
      _id: rawUserDoc._id,
      fullName: rawUserDoc.fullName,
      email: rawUserDoc.email,
      employee: rawUserDoc.employee,
      typeof_employee: typeof rawUserDoc.employee,
    });

    assert(
      rawUserDoc.employee !== null &&
        rawUserDoc.employee instanceof mongoose.Types.ObjectId &&
        rawUserDoc.employee.toString() === fetchedEmp._id.toString(),
      `User.employee is an ObjectId matching Employee._id (${rawUserDoc.employee.toString()})`
    );
    assert(
      typeof rawUserDoc.employee !== "boolean",
      "User.employee is NOT stored as a boolean 'true'"
    );

    // Populate test: User.findById(id).populate('employee')
    const populatedUser = await User.findById(userDoc._id).populate("employee");
    assert(
      populatedUser.employee &&
        populatedUser.employee._id.toString() === fetchedEmp._id.toString() &&
        populatedUser.employee.fullName === "Verified Relational User",
      `Populating User.employee resolves complete Employee document (${populatedUser.employee.fullName}, ${populatedUser.employee.employeeCode})`
    );

    // ----------------------------------------------------
    // STEP 3: MANUAL EMPLOYEE ENTRY FLOW
    // ----------------------------------------------------
    console.log("\n--- Step 3: Manual Employee Entry Flow ---");
    const manualEmail = `manual_unlinked_${Date.now()}@example.com`;
    const userCountBefore = await User.countDocuments();

    const manualEmp = await employeeService.create({
      fullName: "Manual Unlinked Employee",
      email: manualEmail,
    });
    createdEmployees.push(manualEmp);

    const userCountAfter = await User.countDocuments();
    const fetchedManualEmp = await Employee.findById(manualEmp._id);

    assert(
      fetchedManualEmp !== null && fetchedManualEmp.email === manualEmail.toLowerCase(),
      `Manual Employee document created in Employee collection (code: ${fetchedManualEmp.employeeCode})`
    );
    assert(
      userCountBefore === userCountAfter,
      "Manual Employee creation created ZERO User documents (User collection count unchanged)"
    );

    // ----------------------------------------------------
    // STEP 4: DUPLICATE & ALREADY LINKED PROTECTIONS
    // ----------------------------------------------------
    console.log("\n--- Step 4: Duplicate & Already-Linked Protections ---");

    // Attempt to link the same user again
    let alreadyLinkedRejected = false;
    try {
      await employeeService.create({
        fullName: "Another Employee Linking Attempt",
        email: `another_${Date.now()}@example.com`,
        linkUserId: userDoc._id,
      });
    } catch (err) {
      alreadyLinkedRejected = true;
      assert(
        err.statusCode === 409,
        `Already linked user rejection returns HTTP 409 (message: "${err.message}")`
      );
    }
    assert(alreadyLinkedRejected, "Rejected attempt to link already-linked User account");

    // Attempt manual creation with duplicate email
    let dupEmailRejected = false;
    try {
      await employeeService.create({
        fullName: "Duplicate Manual Email",
        email: manualEmail.toUpperCase(),
      });
    } catch (err) {
      dupEmailRejected = true;
      assert(
        err.statusCode === 409 && (err.code === "EMPLOYEE_EMAIL_EXISTS" || err.code === 11000),
        `Duplicate email rejected with HTTP 409 conflict (code: "${err.code}")`
      );
    }
    assert(dupEmailRejected, "Rejected attempt to create employee with existing email (case-insensitive)");

  } finally {
    // Cleanup temporary test records
    console.log("\n--- Cleaning up temporary test records ---");
    for (const emp of createdEmployees) {
      if (emp?._id) await Employee.findByIdAndDelete(emp._id);
    }
    for (const usr of createdUsers) {
      if (usr?._id) await User.findByIdAndDelete(usr._id);
    }
    console.log("Cleanup complete.");
  }

  console.log("\n==========================================================");
  console.log(`VERIFICATION SUMMARY: ${passed} passed, ${failed} failed`);
  console.log("==========================================================");

  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

verifyRelationship().catch((err) => {
  console.error("Verification error:", err);
  process.exit(1);
});
