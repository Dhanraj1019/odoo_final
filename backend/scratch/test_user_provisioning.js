const http = require("http");
const mongoose = require("mongoose");
const User = require("../src/models/User");
const Employee = require("../src/models/Employee");
const Department = require("../src/models/Department");
const JobPosition = require("../src/models/JobPosition");

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
  console.log("   TESTING USER PROVISIONING & EMPLOYEE LINKING   ");
  console.log("==================================================\n");

  const timestamp = Date.now();
  const testAdminEmail = `admin_tester_${timestamp}@example.com`;
  const testEmployeeEmail = `staff_member_${timestamp}@example.com`;
  const testRegularUserEmail = `regular_user_${timestamp}@example.com`;
  const testPassword = "Password123!";

  // 1. Create test admin and department / employee in DB
  const adminUser = new User({
    fullName: "Admin Tester",
    email: testAdminEmail,
    password: testPassword,
    roles: ["Admin"],
    isActive: true,
  });
  await adminUser.save();

  const regularUser = new User({
    fullName: "Regular User",
    email: testRegularUserEmail,
    password: testPassword,
    roles: ["Employee"],
    isActive: true,
  });
  await regularUser.save();

  const dept = new Department({ name: `TechDept_${timestamp}` });
  await dept.save();

  const employee = new Employee({
    fullName: "Johnathan Doe",
    employeeCode: `EMP${timestamp.toString().slice(-4)}`,
    email: testEmployeeEmail,
    department: dept._id,
    status: "Active",
  });
  await employee.save();

  console.log("Created test database records:");
  console.log(`- Admin: ${testAdminEmail}`);
  console.log(`- Regular User: ${testRegularUserEmail}`);
  console.log(`- Employee: ${testEmployeeEmail} (ID: ${employee._id})\n`);

  try {
    const adminCookie = await loginUser(testAdminEmail, testPassword);
    const regularCookie = await loginUser(testRegularUserEmail, testPassword);

    // Test 1: Lookup employee by email (Found)
    console.log("[Test 1] Lookup employee by valid email...");
    const lookupRes1 = await makeRequest(
      `/api/employees/lookup?email=${encodeURIComponent(testEmployeeEmail)}`,
      "GET",
      null,
      { Cookie: adminCookie }
    );
    console.log("Status:", lookupRes1.status, "Body:", JSON.stringify(lookupRes1.body));
    if (lookupRes1.status !== 200 || !lookupRes1.body?.data?.found) {
      throw new Error("Test 1 Failed: Employee lookup failed");
    }
    if (lookupRes1.body.data.hasUserAccount !== false) {
      throw new Error("Test 1 Failed: Expected hasUserAccount to be false");
    }
    console.log("✓ Test 1 Passed: Employee successfully looked up.\n");

    // Test 2: Lookup non-existent employee
    console.log("[Test 2] Lookup employee with non-existent email...");
    const lookupRes2 = await makeRequest(
      `/api/employees/lookup?email=nobody_${timestamp}@example.com`,
      "GET",
      null,
      { Cookie: adminCookie }
    );
    console.log("Status:", lookupRes2.status, "Body:", JSON.stringify(lookupRes2.body));
    if (lookupRes2.status !== 200 || lookupRes2.body?.data?.found !== false) {
      throw new Error("Test 2 Failed: Expected found: false for non-existent employee");
    }
    console.log("✓ Test 2 Passed: Non-existent employee handled cleanly.\n");

    // Test 3: Provision User for Employee
    console.log("[Test 3] Provision new user for Employee using employeeId...");
    const createRes = await makeRequest(
      "/api/users",
      "POST",
      {
        employeeId: employee._id.toString(),
        password: testPassword,
        roles: ["HR Payroll User", "Employee"],
      },
      { Cookie: adminCookie }
    );
    console.log("Status:", createRes.status, "Body:", JSON.stringify(createRes.body));
    if (createRes.status !== 201 || !createRes.body?.data?.user) {
      throw new Error("Test 3 Failed: User provisioning failed");
    }
    const createdUser = createRes.body.data.user;
    if (createdUser.email !== testEmployeeEmail.toLowerCase()) {
      throw new Error(`Test 3 Failed: Email mismatch: ${createdUser.email} vs ${testEmployeeEmail}`);
    }
    if (createdUser.fullName !== "Johnathan Doe") {
      throw new Error(`Test 3 Failed: Full name mismatch: ${createdUser.fullName}`);
    }
    console.log("✓ Test 3 Passed: User successfully provisioned and linked to Employee.\n");

    // Test 4: Duplicate Employee Provisioning Prevention
    console.log("[Test 4] Attempt duplicate user provisioning for same Employee...");
    const dupEmployeeRes = await makeRequest(
      "/api/users",
      "POST",
      {
        employeeId: employee._id.toString(),
        password: testPassword,
        roles: ["Employee"],
      },
      { Cookie: adminCookie }
    );
    console.log("Status:", dupEmployeeRes.status, "Body:", JSON.stringify(dupEmployeeRes.body));
    if (dupEmployeeRes.status !== 409 || !dupEmployeeRes.body?.message?.includes("already has a user account")) {
      throw new Error("Test 4 Failed: Expected 409 already has a user account");
    }
    console.log("✓ Test 4 Passed: Duplicate employee linking prevented with friendly error.\n");

    // Test 5: Verify Lookup on Linked Employee shows hasUserAccount: true
    console.log("[Test 5] Verify Lookup on linked Employee shows hasUserAccount: true...");
    const lookupRes3 = await makeRequest(
      `/api/employees/lookup?email=${encodeURIComponent(testEmployeeEmail)}`,
      "GET",
      null,
      { Cookie: adminCookie }
    );
    console.log("Status:", lookupRes3.status, "Body:", JSON.stringify(lookupRes3.body));
    if (lookupRes3.status !== 200 || !lookupRes3.body?.data?.hasUserAccount) {
      throw new Error("Test 5 Failed: Expected hasUserAccount: true");
    }
    console.log("✓ Test 5 Passed: Lookup correctly reports existing user account.\n");

    // Test 6: Role Security - Regular employee cannot lookup employee
    console.log("[Test 6] Verify Regular Employee is blocked from lookup...");
    const blockRes = await makeRequest(
      `/api/employees/lookup?email=${encodeURIComponent(testEmployeeEmail)}`,
      "GET",
      null,
      { Cookie: regularCookie }
    );
    console.log("Status:", blockRes.status);
    if (blockRes.status !== 403) {
      throw new Error("Test 6 Failed: Regular employee should be blocked with 403");
    }
    console.log("✓ Test 6 Passed: Unauthorized role correctly blocked with 403.\n");

    console.log("==================================================");
    console.log("    ALL USER PROVISIONING & LINKING TESTS PASSED! ");
    console.log("==================================================");
  } finally {
    // Cleanup test records
    await User.deleteMany({ email: { $in: [testAdminEmail, testEmployeeEmail, testRegularUserEmail] } });
    await Employee.deleteMany({ email: testEmployeeEmail });
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
