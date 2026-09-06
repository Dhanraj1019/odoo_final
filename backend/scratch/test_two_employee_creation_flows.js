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
  console.log("   TESTING TWO EMPLOYEE CREATION FLOWS            ");
  console.log("==================================================\n");

  const timestamp = Date.now();
  const testAdminEmail = `admin_hr_${timestamp}@example.com`;
  const existingUserEmail = `registered_user_${timestamp}@example.com`;
  const manualEmployeeEmail = `manual_emp_${timestamp}@example.com`;
  const testPassword = "Password123!";

  // 1. Create Admin User
  const adminUser = new User({
    fullName: "HR Admin Tester",
    email: testAdminEmail,
    password: testPassword,
    roles: ["Admin", "HR Manager"],
    isActive: true,
  });
  await adminUser.save();

  // 2. Create Existing User for Flow A
  const existingUser = new User({
    fullName: "Nishu Yadav Registered",
    email: existingUserEmail,
    password: testPassword,
    roles: ["Employee"],
    employee: null,
    isActive: true,
  });
  await existingUser.save();

  const dept = new Department({ name: `Engineering_${timestamp}` });
  await dept.save();

  console.log("Created test database records:");
  console.log(`- Admin: ${testAdminEmail}`);
  console.log(`- Existing User for Flow A: ${existingUserEmail} (ID: ${existingUser._id})\n`);

  try {
    const adminCookie = await loginUser(testAdminEmail, testPassword);

    // ==========================================
    // TEST FLOW A: Add from Existing Account
    // ==========================================
    console.log("--- TEST FLOW A: Add from Existing Account ---");

    // Step A1: Search user by email in User collection
    console.log("[Step A1] Search user by email in User collection...");
    const lookupRes = await makeRequest(
      `/api/users/lookup?email=${encodeURIComponent(existingUserEmail)}`,
      "GET",
      null,
      { Cookie: adminCookie }
    );
    console.log("Status:", lookupRes.status, "Body:", JSON.stringify(lookupRes.body));
    if (lookupRes.status !== 200 || !lookupRes.body?.data?.found) {
      throw new Error("Flow A Failed: User lookup returned found: false");
    }
    console.log("✓ User successfully found in User collection.");

    // Step A2: Create Employee linked to the existing user
    console.log("[Step A2] Create Employee record linked to the existing User...");
    const codeA = `EMPA${timestamp.toString().slice(-4)}`;
    const createEmpResA = await makeRequest(
      "/api/employees",
      "POST",
      {
        linkUserId: existingUser._id.toString(),
        fullName: existingUser.fullName,
        email: existingUser.email,
        employeeCode: codeA,
        department: dept._id.toString(),
        employeeType: "Full-Time",
        status: "Active",
      },
      { Cookie: adminCookie }
    );
    console.log("Status:", createEmpResA.status, "Body:", JSON.stringify(createEmpResA.body));
    if (createEmpResA.status !== 201 || !createEmpResA.body?.data?.employee) {
      throw new Error("Flow A Failed: Employee creation failed");
    }
    const createdEmpA = createEmpResA.body.data.employee;
    console.log(`✓ Employee created with ID: ${createdEmpA._id}`);

    // Step A3: Verify User document in MongoDB has employee reference
    const updatedUserInDb = await User.findById(existingUser._id);
    console.log(`[Step A3] Verify User.employee in DB: ${updatedUserInDb.employee}`);
    if (!updatedUserInDb.employee || updatedUserInDb.employee.toString() !== createdEmpA._id.toString()) {
      throw new Error(`Flow A Failed: User.employee (${updatedUserInDb.employee}) did not match Employee ID (${createdEmpA._id})`);
    }
    console.log("✓ Flow A PASSED: User and Employee successfully linked according to schema!\n");

    // ==========================================
    // TEST FLOW B: Add Manually
    // ==========================================
    console.log("--- TEST FLOW B: Add Manually ---");

    // Step B1: Create Employee manually without user link
    console.log("[Step B1] Create standalone Employee manually (No linkUserId)...");
    const codeB = `EMPB${timestamp.toString().slice(-4)}`;
    const createEmpResB = await makeRequest(
      "/api/employees",
      "POST",
      {
        fullName: "Manual Standalone Staff",
        email: manualEmployeeEmail,
        employeeCode: codeB,
        department: dept._id.toString(),
        employeeType: "Full-Time",
        status: "Active",
      },
      { Cookie: adminCookie }
    );
    console.log("Status:", createEmpResB.status, "Body:", JSON.stringify(createEmpResB.body));
    if (createEmpResB.status !== 201 || !createEmpResB.body?.data?.employee) {
      throw new Error("Flow B Failed: Manual Employee creation failed");
    }
    const createdEmpB = createEmpResB.body.data.employee;
    console.log(`✓ Manual Employee created with ID: ${createdEmpB._id}`);

    // Step B2: Verify NO User account was created in User collection
    const userInDbForB = await User.findOne({ email: manualEmployeeEmail.toLowerCase() });
    console.log(`[Step B2] Verify no User account in DB for manual employee:`, userInDbForB);
    if (userInDbForB !== null) {
      throw new Error(`Flow B Failed: Unexpected User account created for manual employee: ${userInDbForB._id}`);
    }
    console.log("✓ Flow B PASSED: Standalone Employee created with ZERO user accounts or credentials!\n");

    console.log("==================================================");
    console.log("   ALL TWO EMPLOYEE CREATION TESTS PASSED!        ");
    console.log("==================================================");
  } finally {
    // Cleanup
    await User.deleteMany({ email: { $in: [testAdminEmail, existingUserEmail] } });
    await Employee.deleteMany({ email: { $in: [existingUserEmail, manualEmployeeEmail] } });
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
