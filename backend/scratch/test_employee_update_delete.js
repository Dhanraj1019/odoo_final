const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const Employee = require("../src/models/Employee");
const User = require("../src/models/User");
const Department = require("../src/models/Department");
const JobPosition = require("../src/models/JobPosition");
const WorkingSchedule = require("../src/models/WorkingSchedule");
const Contract = require("../src/models/Contract");
const Payslip = require("../src/models/Payslip");
const Attendance = require("../src/models/Attendance");
const TimeOffRequest = require("../src/models/TimeOffRequest");
const TimeOffAllocation = require("../src/models/TimeOffAllocation");
const employeeService = require("../src/services/employee.service");

async function runTests() {
  console.log("==========================================================");
  console.log("STARTING FULL EMPLOYEE UPDATE & DELETE TEST SUITE");
  console.log("==========================================================");

  await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/peoplepay360");
  console.log("Connected to MongoDB");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  const createdEmployeeIds = [];
  const createdUserIds = [];
  const createdOperationalIds = [];

  try {
    const timestamp = Date.now();

    // ----------------------------------------------------
    // TEST 1: Manual Employee Update
    // ----------------------------------------------------
    console.log("\n--- TEST 1: Manual Employee Update ---");
    const userCountBeforeTest1 = await User.countDocuments();
    const manualEmp1 = await employeeService.create({
      fullName: `Manual Update Emp ${timestamp}`,
      email: `manual_update_${timestamp}@example.com`,
      phone: "111-222-3333",
      employeeType: "Full-Time",
      status: "Active",
    });
    createdEmployeeIds.push(manualEmp1._id);

    const updatedManual = await employeeService.update(manualEmp1._id, {
      fullName: `Manual Update Emp Edited ${timestamp}`,
      phone: "999-888-7777",
      status: "Inactive",
    });
    const userCountAfterTest1 = await User.countDocuments();

    assert(
      updatedManual.fullName === `Manual Update Emp Edited ${timestamp}` &&
        updatedManual.phone === "999-888-7777" &&
        updatedManual.status === "Inactive" &&
        userCountBeforeTest1 === userCountAfterTest1,
      "TEST 1: Manual Employee updated successfully with zero User modifications"
    );

    // ----------------------------------------------------
    // TEST 2: Linked Employee Update with Shared Field Synchronization
    // ----------------------------------------------------
    console.log("\n--- TEST 2: Linked Employee Update & User Synchronization ---");
    const userForSync = new User({
      fullName: `Sync User ${timestamp}`,
      email: `sync_user_${timestamp}@example.com`,
      roles: ["Employee"],
      passwordHash: "$2a$10$abcdefg1234567890dummyhashforverification",
    });
    await userForSync.save();
    createdUserIds.push(userForSync._id);

    const linkedEmpForSync = await employeeService.create({
      fullName: userForSync.fullName,
      email: userForSync.email,
      linkUserId: userForSync._id,
    });
    createdEmployeeIds.push(linkedEmpForSync._id);

    // Update both full name and email on the employee
    const newSyncedName = `Sync User Updated ${timestamp}`;
    const newSyncedEmail = `sync_user_updated_${timestamp}@example.com`;

    const updatedLinkedEmp = await employeeService.update(linkedEmpForSync._id, {
      fullName: newSyncedName,
      email: newSyncedEmail,
    });

    const refreshedLinkedUser = await User.findById(userForSync._id);

    assert(
      updatedLinkedEmp.fullName === newSyncedName &&
        updatedLinkedEmp.email === newSyncedEmail &&
        refreshedLinkedUser.fullName === newSyncedName &&
        refreshedLinkedUser.email === newSyncedEmail &&
        String(refreshedLinkedUser.employee) === String(linkedEmpForSync._id),
      "TEST 2: Linked Employee update synchronized shared fields (fullName, email) with linked User document"
    );

    // ----------------------------------------------------
    // TEST 3: Manual Employee Delete
    // ----------------------------------------------------
    console.log("\n--- TEST 3: Manual Employee Delete ---");
    const manualDeleteEmp = await employeeService.create({
      fullName: `Manual Delete Emp ${timestamp}`,
      email: `manual_del_${timestamp}@example.com`,
    });

    const usersBeforeDel = await User.countDocuments();
    await employeeService.delete(manualDeleteEmp._id);
    const usersAfterDel = await User.countDocuments();
    const lookupDeletedManual = await Employee.findById(manualDeleteEmp._id);

    assert(
      lookupDeletedManual === null && usersBeforeDel === usersAfterDel,
      "TEST 3: Manual Employee deleted cleanly; User collection completely unchanged"
    );

    // ----------------------------------------------------
    // TEST 4: Linked Employee Delete (User Account Remains Intact & Unlinked)
    // ----------------------------------------------------
    console.log("\n--- TEST 4: Linked Employee Delete ---");
    const userForDel = new User({
      fullName: `User Keep Account ${timestamp}`,
      email: `user_keep_${timestamp}@example.com`,
      roles: ["Employee"],
      passwordHash: "$2a$10$abcdefg1234567890dummyhashforverification",
    });
    await userForDel.save();
    createdUserIds.push(userForDel._id);

    const linkedEmpForDel = await employeeService.create({
      fullName: userForDel.fullName,
      email: userForDel.email,
      linkUserId: userForDel._id,
    });

    await employeeService.delete(linkedEmpForDel._id);

    const deletedEmpLookup = await Employee.findById(linkedEmpForDel._id);
    const userAfterEmpDelete = await User.findById(userForDel._id);

    assert(
      deletedEmpLookup === null,
      "TEST 4A: Linked Employee document removed from Employee collection"
    );
    assert(
      userAfterEmpDelete !== null &&
        userAfterEmpDelete.employee === null &&
        userAfterEmpDelete.email === `user_keep_${timestamp}@example.com` &&
        userAfterEmpDelete.passwordHash === "$2a$10$abcdefg1234567890dummyhashforverification",
      "TEST 4B: Linked User account STILL EXISTS, User.employee is null, and credentials/roles remain 100% intact"
    );

    // ----------------------------------------------------
    // TEST 5: Update Employee Email to Existing Employee Email Conflict
    // ----------------------------------------------------
    console.log("\n--- TEST 5: Duplicate Employee Email Conflict ---");
    const empConflictA = await employeeService.create({
      fullName: `Conflict Emp A ${timestamp}`,
      email: `conflict_a_${timestamp}@example.com`,
    });
    createdEmployeeIds.push(empConflictA._id);

    const empConflictB = await employeeService.create({
      fullName: `Conflict Emp B ${timestamp}`,
      email: `conflict_b_${timestamp}@example.com`,
    });
    createdEmployeeIds.push(empConflictB._id);

    let dupEmpEmailErr = null;
    try {
      await employeeService.update(empConflictB._id, { email: empConflictA.email });
    } catch (err) {
      dupEmpEmailErr = err;
    }

    assert(
      dupEmpEmailErr && dupEmpEmailErr.statusCode === 409,
      "TEST 5: Updating employee email to an existing employee's email is rejected with 409 Conflict"
    );

    // ----------------------------------------------------
    // TEST 6: Linked Employee Email Conflict with another User Account
    // ----------------------------------------------------
    console.log("\n--- TEST 6: Linked Employee User Email Conflict ---");
    const unrelatedUser = new User({
      fullName: `Unrelated User ${timestamp}`,
      email: `unrelated_user_${timestamp}@example.com`,
      roles: ["Employee"],
      passwordHash: "$2a$10$abcdefg1234567890dummyhashforverification",
    });
    await unrelatedUser.save();
    createdUserIds.push(unrelatedUser._id);

    let userConflictErr = null;
    try {
      // Attempt to change linkedEmpForSync's email to unrelatedUser's email
      await employeeService.update(linkedEmpForSync._id, { email: unrelatedUser.email });
    } catch (err) {
      userConflictErr = err;
    }

    assert(
      userConflictErr && userConflictErr.statusCode === 409,
      "TEST 6: Updating linked employee email to an email used by another User is rejected with 409 Conflict"
    );

    // ----------------------------------------------------
    // TEST 7: Duplicate Employee Code Validation
    // ----------------------------------------------------
    console.log("\n--- TEST 7: Duplicate Employee Code Validation ---");
    let dupCodeErr = null;
    try {
      await employeeService.update(empConflictB._id, { employeeCode: empConflictA.employeeCode });
    } catch (err) {
      dupCodeErr = err;
    }

    assert(
      dupCodeErr && dupCodeErr.statusCode === 409,
      "TEST 7: Updating employee code to another employee's code is rejected with 409 Conflict"
    );

    // ----------------------------------------------------
    // TEST 8: Delete Non-Existent Employee
    // ----------------------------------------------------
    console.log("\n--- TEST 8: Non-Existent Employee Delete ---");
    let notFoundDelErr = null;
    try {
      await employeeService.delete(new mongoose.Types.ObjectId());
    } catch (err) {
      notFoundDelErr = err;
    }

    assert(
      notFoundDelErr && notFoundDelErr.statusCode === 404,
      "TEST 8: Deleting non-existent employee returns 404 Not Found without crashing"
    );

    // ----------------------------------------------------
    // TEST 9: Linked User Detected Via User.employee
    // ----------------------------------------------------
    console.log("\n--- TEST 9: User.employee Direction Detection ---");
    const userSideLinked = new User({
      fullName: `User Side Link ${timestamp}`,
      email: `userside_${timestamp}@example.com`,
      roles: ["Employee"],
      passwordHash: "$2a$10$abcdefg1234567890dummyhashforverification",
    });
    await userSideLinked.save();
    createdUserIds.push(userSideLinked._id);

    const empForUserSide = await employeeService.create({
      fullName: userSideLinked.fullName,
      email: userSideLinked.email,
      linkUserId: userSideLinked._id,
    });

    await employeeService.delete(empForUserSide._id);
    const userAfterDeleteCheck = await User.findById(userSideLinked._id);

    assert(
      userAfterDeleteCheck.employee === null,
      "TEST 9: Linked User detected via User.employee and cleanly unlinked on deletion"
    );

    // ----------------------------------------------------
    // TEST 10: Whitelisting Protection
    // ----------------------------------------------------
    console.log("\n--- TEST 10: Whitelisting Protection ---");
    const updatedWithExtra = await employeeService.update(manualEmp1._id, {
      fullName: "Whitelisted Name",
      unauthorizedSecretField: "malicious_payload",
      isAdmin: true,
      __v: 999,
    });

    assert(
      updatedWithExtra.fullName === "Whitelisted Name" &&
        updatedWithExtra.unauthorizedSecretField === undefined &&
        updatedWithExtra.isAdmin === undefined,
      "TEST 10: Arbitrary unwhitelisted request fields are stripped and not saved to database"
    );

    // ----------------------------------------------------
    // TEST 11: Manager Hierarchy Unlinking on Delete
    // ----------------------------------------------------
    console.log("\n--- TEST 11: Manager Hierarchy Unlinking ---");
    const managerEmp = await employeeService.create({
      fullName: `Manager Head ${timestamp}`,
      email: `mgr_${timestamp}@example.com`,
    });

    const subordinateEmp = await employeeService.create({
      fullName: `Subordinate Staff ${timestamp}`,
      email: `sub_${timestamp}@example.com`,
      manager: managerEmp._id,
    });
    createdEmployeeIds.push(subordinateEmp._id);

    await employeeService.delete(managerEmp._id);
    const refreshedSub = await Employee.findById(subordinateEmp._id);

    assert(
      refreshedSub.manager === null,
      "TEST 11: Deleting a manager safely clears the manager reference on subordinates to null"
    );

    // ----------------------------------------------------
    // TEST 12: Operational Records Protection
    // ----------------------------------------------------
    console.log("\n--- TEST 12: Operational Records Protection ---");
    const protectedEmp = await employeeService.create({
      fullName: `Protected Contract Emp ${timestamp}`,
      email: `protected_contract_${timestamp}@example.com`,
    });
    createdEmployeeIds.push(protectedEmp._id);

    const contract = new Contract({
      employee: protectedEmp._id,
      contractReference: `Contract-${protectedEmp.employeeCode}`,
      startDate: new Date(),
      wagePerMonth: 6500,
      status: "Active",
    });
    await contract.save();
    createdOperationalIds.push({ model: "Contract", id: contract._id });

    let opRecordDelErr = null;
    try {
      await employeeService.delete(protectedEmp._id);
    } catch (err) {
      opRecordDelErr = err;
    }

    assert(
      opRecordDelErr && opRecordDelErr.statusCode === 409,
      "TEST 12: Deletion is strictly blocked with 409 Conflict when employee has operational records"
    );

    // ----------------------------------------------------
    // TEST 13: Self-Manager Update Prevention
    // ----------------------------------------------------
    console.log("\n--- TEST 13: Self-Manager Update Prevention ---");
    let selfMgrErr = null;
    try {
      await employeeService.update(manualEmp1._id, { manager: manualEmp1._id });
    } catch (err) {
      selfMgrErr = err;
    }

    assert(
      selfMgrErr && selfMgrErr.statusCode === 400,
      "TEST 13: Setting an employee as their own manager is rejected with 400 Bad Request"
    );

    // ----------------------------------------------------
    // TEST 14: Invalid ID Format Handling
    // ----------------------------------------------------
    console.log("\n--- TEST 14: Invalid ID Format Handling ---");
    let invalidUpdateErr = null;
    let invalidDeleteErr = null;

    try {
      await employeeService.update("invalid_id", { fullName: "Test" });
    } catch (err) {
      invalidUpdateErr = err;
    }

    try {
      await employeeService.delete("invalid_id");
    } catch (err) {
      invalidDeleteErr = err;
    }

    assert(
      invalidUpdateErr && invalidUpdateErr.statusCode === 400 &&
        invalidDeleteErr && invalidDeleteErr.statusCode === 400,
      "TEST 14: Invalid ObjectId strings on update and delete return 400 Bad Request"
    );

  } catch (err) {
    console.error("Unexpected test execution error:", err);
    failed++;
  } finally {
    console.log("\n--- Cleaning up temporary test records ---");
    for (const id of createdEmployeeIds) {
      await Employee.findByIdAndDelete(id).catch(() => {});
    }
    for (const id of createdUserIds) {
      await User.findByIdAndDelete(id).catch(() => {});
    }
    for (const item of createdOperationalIds) {
      if (item.model === "Contract") {
        await Contract.findByIdAndDelete(item.id).catch(() => {});
      }
    }
    console.log("Cleanup complete.");
    await mongoose.disconnect();
  }

  console.log("\n==========================================================");
  console.log(`TEST SUMMARY: ${passed} passed, ${failed} failed`);
  console.log("==========================================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
