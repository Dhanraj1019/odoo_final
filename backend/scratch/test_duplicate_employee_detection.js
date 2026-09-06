const http = require("http");
const mongoose = require("mongoose");
const User = require("../src/models/User");
const Employee = require("../src/models/Employee");
const Department = require("../src/models/Department");

const PORT = 5000;
const BASE_URL = `http://127.0.0.1:${PORT}`;

function makeRequest(path, method = "GET", body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: parsed });
      });
    });

    req.on("error", reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function loginUser(email, password) {
  const res = await makeRequest("/api/auth/login", "POST", { email, password });
  if (res.status !== 200) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(res.body)}`);
  }
  const setCookie = res.headers["set-cookie"];
  const cookieStr = Array.isArray(setCookie) ? setCookie.map((c) => c.split(";")[0]).join("; ") : "";
  return cookieStr;
}

async function runTests() {
  console.log("==================================================");
  console.log("   TESTING DUPLICATE EMPLOYEE DETECTION IN LOOKUP ");
  console.log("==================================================\n");

  const timestamp = Date.now();
  const testAdminEmail = `admin_${timestamp}@example.com`;
  const unlinkedUserEmail = `unlinked_user_${timestamp}@example.com`;
  const linkedUserEmail = `linked_user_${timestamp}@example.com`;
  const legacyInconsistentUserEmail = `legacy_user_${timestamp}@example.com`;
  const testPassword = "Password123!";

  // 1. Setup Admin User
  const adminUser = new User({
    fullName: "Admin Tester",
    email: testAdminEmail,
    password: testPassword,
    roles: ["Admin"],
    isActive: true,
  });
  await adminUser.save();

  // 2. Setup Case A: Unlinked User (Not an employee)
  const unlinkedUser = new User({
    fullName: "Unlinked Account",
    email: unlinkedUserEmail,
    password: testPassword,
    roles: ["Employee"],
    employee: null,
    isActive: true,
  });
  await unlinkedUser.save();

  // 3. Setup Case B: Linked User (Check 1: User.employee is populated)
  const dept = new Department({ name: `Dept_${timestamp}` });
  await dept.save();

  const employee1 = new Employee({
    fullName: "Linked Staff Member",
    employeeCode: `EMP${timestamp.toString().slice(-4)}A`,
    email: linkedUserEmail,
    department: dept._id,
    status: "Active",
  });
  await employee1.save();

  const linkedUser = new User({
    fullName: "Linked Staff Member",
    email: linkedUserEmail,
    password: testPassword,
    roles: ["Employee"],
    employee: employee1._id,
    isActive: true,
  });
  await linkedUser.save();

  // 4. Setup Case C: Inconsistent User (Check 2: User.employee is NULL, but Employee record exists with that email)
  const employee2 = new Employee({
    fullName: "Legacy Inconsistent Staff",
    employeeCode: `EMP${timestamp.toString().slice(-4)}B`,
    email: legacyInconsistentUserEmail,
    department: dept._id,
    status: "Active",
  });
  await employee2.save();

  const legacyUser = new User({
    fullName: "Legacy Inconsistent Staff",
    email: legacyInconsistentUserEmail,
    password: testPassword,
    roles: ["Employee"],
    employee: null, // Note: null in User table!
    isActive: true,
  });
  await legacyUser.save();

  console.log("Created test database records:");
  console.log(`- Admin: ${testAdminEmail}`);
  console.log(`- Unlinked User: ${unlinkedUserEmail}`);
  console.log(`- Linked User (User.employee set): ${linkedUserEmail}`);
  console.log(`- Inconsistent User (User.employee null, but in Employee coll): ${legacyInconsistentUserEmail}\n`);

  try {
    const adminCookie = await loginUser(testAdminEmail, testPassword);

    // Initial count of records to verify read-only safety
    const initialUserCount = await User.countDocuments();
    const initialEmployeeCount = await Employee.countDocuments();

    // Test 1: Non-existent user
    console.log("[Test 1] Lookup non-existent email in User collection...");
    const res1 = await makeRequest(
      `/api/users/lookup?email=unknown_${timestamp}@example.com`,
      "GET",
      null,
      { Cookie: adminCookie }
    );
    console.log("Status:", res1.status, "Body:", JSON.stringify(res1.body));
    if (res1.status !== 200 || res1.body?.data?.found !== false) {
      throw new Error("Test 1 Failed: Expected found: false");
    }
    console.log("✓ Test 1 Passed: Non-existent user correctly returns found: false.\n");

    // Test 2: Unlinked user (Exists in User table, NOT an employee)
    console.log("[Test 2] Lookup unlinked user (NOT an employee)...");
    const res2 = await makeRequest(
      `/api/users/lookup?email=${encodeURIComponent(unlinkedUserEmail)}`,
      "GET",
      null,
      { Cookie: adminCookie }
    );
    console.log("Status:", res2.status, "Body:", JSON.stringify(res2.body));
    if (res2.status !== 200 || !res2.body?.data?.found || res2.body?.data?.isAlreadyEmployee !== false) {
      throw new Error("Test 2 Failed: Expected found: true and isAlreadyEmployee: false");
    }
    console.log("✓ Test 2 Passed: Unlinked user correctly identified as available (not duplicate employee).\n");

    // Test 3: Linked user (Check 1: User.employee != null)
    console.log("[Test 3] Lookup linked user (User.employee references Employee record)...");
    const res3 = await makeRequest(
      `/api/users/lookup?email=${encodeURIComponent(linkedUserEmail)}`,
      "GET",
      null,
      { Cookie: adminCookie }
    );
    console.log("Status:", res3.status, "Body:", JSON.stringify(res3.body));
    if (res3.status !== 200 || !res3.body?.data?.found || res3.body?.data?.isAlreadyEmployee !== true) {
      throw new Error("Test 3 Failed: Expected isAlreadyEmployee: true via Check 1");
    }
    if (!res3.body.data.linkedEmployee?.employeeCode) {
      throw new Error("Test 3 Failed: Expected linkedEmployee details in response");
    }
    console.log("✓ Test 3 Passed: User with employee reference correctly identified as Already an Employee.\n");

    // Test 4: Inconsistent legacy user (Check 2: User.employee is null, but Employee collection has record)
    console.log("[Test 4] Lookup legacy user (User.employee is null, but Employee collection has record)...");
    const res4 = await makeRequest(
      `/api/users/lookup?email=${encodeURIComponent(legacyInconsistentUserEmail)}`,
      "GET",
      null,
      { Cookie: adminCookie }
    );
    console.log("Status:", res4.status, "Body:", JSON.stringify(res4.body));
    if (res4.status !== 200 || !res4.body?.data?.found || res4.body?.data?.isAlreadyEmployee !== true) {
      throw new Error("Test 4 Failed: Expected isAlreadyEmployee: true via Check 2 (Employee collection query)");
    }
    console.log("✓ Test 4 Passed: Check 2 successfully caught existing Employee record even with null User.employee.\n");

    // Test 5: Verify Read-Only Safety (DB counts remain completely unchanged)
    const finalUserCount = await User.countDocuments();
    const finalEmployeeCount = await Employee.countDocuments();
    if (initialUserCount !== finalUserCount || initialEmployeeCount !== finalEmployeeCount) {
      throw new Error(`Test 5 Failed: DB count altered! Users: ${initialUserCount}->${finalUserCount}, Employees: ${initialEmployeeCount}->${finalEmployeeCount}`);
    }
    console.log("✓ Test 5 Passed: Search operations are 100% read-only with zero database mutations.\n");

    console.log("==================================================");
    console.log("   ALL DUPLICATE EMPLOYEE DETECTION TESTS PASSED! ");
    console.log("==================================================");
  } finally {
    // Cleanup test records
    await User.deleteMany({ email: { $in: [testAdminEmail, unlinkedUserEmail, linkedUserEmail, legacyInconsistentUserEmail] } });
    await Employee.deleteMany({ email: { $in: [linkedUserEmail, legacyInconsistentUserEmail] } });
    await Department.findByIdAndDelete(dept._id);
    console.log("\n✓ Cleaned up test database records.");
  }
}

mongoose
  .connect("mongodb://127.0.0.1:27017/peoplepay360_db")
  .then(runTests)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  });
