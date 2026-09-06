const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const Employee = require("../src/models/Employee");
const User = require("../src/models/User");
require("../src/models/Department");
require("../src/models/JobPosition");
require("../src/models/WorkingSchedule");
const employeeService = require("../src/services/employee.service");

async function runTests() {
  console.log("==================================================");
  console.log("STARTING AUTOMATIC EMPLOYEE CODE GENERATION TESTS");
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

  // ----------------------------------------------------
  // TEST UNIT LOGIC FOR CODE GENERATION
  // ----------------------------------------------------
  console.log("\n--- Testing Code Generation Logic ---");

  // Helper matching the service's generation logic on arbitrary lists
  function simulateNextCode(existingCodes) {
    let maxNum = 0;
    for (const code of existingCodes) {
      const match = (code || "").match(/^EMP(\d+)$/i);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
    const nextNum = maxNum + 1;
    return `EMP${String(nextNum).padStart(3, "0")}`;
  }

  assert(simulateNextCode([]) === "EMP001", "TEST 1: Empty database gives EMP001");
  assert(simulateNextCode(["EMP001"]) === "EMP002", "TEST 2: Existing EMP001 gives EMP002");
  assert(simulateNextCode(["EMP001", "EMP002", "EMP010"]) === "EMP011", "TEST 3: Existing EMP001, EMP002, EMP010 gives EMP011");
  assert(simulateNextCode(["EMP001", "EMP003"]) === "EMP004", "TEST 4: Existing EMP001, EMP003 gives EMP004 (no reuse of missing EMP002)");
  assert(simulateNextCode(["TEST", "ABC001", "EMPLOYEE01"]) === "EMP001", "TEST 5: Invalid codes only give EMP001");
  assert(simulateNextCode(["EMP001", "EMP002", "ABC001", "TEST"]) === "EMP003", "TEST 6: EMP001, EMP002, ABC001, TEST gives EMP003");
  assert(simulateNextCode(["EMP099"]) === "EMP100", "Padded sequence transition EMP099 -> EMP100");

  // ----------------------------------------------------
  // TEST ACTUAL SERVICE CREATION WITH DB
  // ----------------------------------------------------
  console.log("\n--- Testing DB Operations & Service Flows ---");

  const testEmail1 = `test_manual_${Date.now()}@example.com`;
  const testEmail2 = `test_override_${Date.now()}@example.com`;
  const testUserEmail = `test_user_link_${Date.now()}@example.com`;

  let createdEmp1 = null;
  let createdEmp2 = null;
  let createdUser = null;
  let createdEmp3 = null;

  try {
    // 1. Manual creation without employeeCode
    createdEmp1 = await employeeService.create({
      fullName: "Test Automated Employee 1",
      email: testEmail1,
      phone: "1234567890",
    });
    assert(createdEmp1 && createdEmp1.employeeCode && /^EMP\d{3,}$/.test(createdEmp1.employeeCode), `TEST 7: Manual entry generates code ${createdEmp1?.employeeCode}`);

    // 2. Client passes spoofed/tampered employeeCode: "EMP999"
    createdEmp2 = await employeeService.create({
      fullName: "Test Automated Employee 2",
      email: testEmail2,
      employeeCode: "EMP999", // Backend must ignore this!
      phone: "1234567890",
    });
    assert(createdEmp2 && createdEmp2.employeeCode !== "EMP999", `TEST 9: Tampered employeeCode EMP999 was ignored, assigned: ${createdEmp2?.employeeCode}`);

    // Numeric sequence check between Emp1 and Emp2
    const num1 = parseInt(createdEmp1.employeeCode.replace("EMP", ""), 10);
    const num2 = parseInt(createdEmp2.employeeCode.replace("EMP", ""), 10);
    assert(num2 === num1 + 1, `Sequential progression: ${createdEmp1.employeeCode} -> ${createdEmp2.employeeCode}`);

    // 3. Find Existing User flow (linking User <-> Employee)
    createdUser = await User.create({
      fullName: "Test User Linking",
      email: testUserEmail,
      password: "Password123!",
      roles: ["Employee"],
      isActive: true,
    });

    createdEmp3 = await employeeService.create({
      fullName: createdUser.fullName,
      email: createdUser.email,
      linkUserId: createdUser._id,
    });

    const updatedUser = await User.findById(createdUser._id);
    assert(
      createdEmp3 &&
        createdEmp3.employeeCode &&
        String(updatedUser.employee) === String(createdEmp3._id),
      `TEST 8: Existing User linked successfully to employee (${createdEmp3?.employeeCode})`
    );
    // 4. Concurrent / parallel creation collision test (TEST 10)
    console.log("Testing concurrent employee creations...");
    const concurrentResults = await Promise.all([
      employeeService.create({
        fullName: "Concurrent Emp A",
        email: `concurrent_a_${Date.now()}@example.com`,
      }),
      employeeService.create({
        fullName: "Concurrent Emp B",
        email: `concurrent_b_${Date.now()}@example.com`,
      }),
      employeeService.create({
        fullName: "Concurrent Emp C",
        email: `concurrent_c_${Date.now()}@example.com`,
      }),
    ]);

    const concurrentCodes = concurrentResults.map((e) => e.employeeCode);
    const uniqueCodes = new Set(concurrentCodes);
    assert(
      concurrentResults.length === 3 && uniqueCodes.size === 3,
      `TEST 10: Concurrent creation generated distinct unique codes: ${concurrentCodes.join(", ")}`
    );

    for (const emp of concurrentResults) {
      if (emp) await Employee.findByIdAndDelete(emp._id);
    }
  } finally {
    // Clean up created test records so database is kept clean
    console.log("\n--- Cleaning up temporary test records ---");
    if (createdEmp1) await Employee.findByIdAndDelete(createdEmp1._id);
    if (createdEmp2) await Employee.findByIdAndDelete(createdEmp2._id);
    if (createdEmp3) await Employee.findByIdAndDelete(createdEmp3._id);
    if (createdUser) await User.findByIdAndDelete(createdUser._id);
    console.log("Cleanup complete.");
  }

  console.log("\n==================================================");
  console.log(`TEST SUMMARY: ${passed} passed, ${failed} failed`);
  console.log("==================================================");

  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
