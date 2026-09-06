const http = require("http");
require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const app = require("../src/app");
const mongoose = require("mongoose");
const User = require("../src/models/User");
const Employee = require("../src/models/Employee");

const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/peoplepay360_db";

async function testClient() {
  console.log("==================================================");
  console.log("   TODO 3: TESTING EXPRESS ROUTE & API CLIENT     ");
  console.log("==================================================");

  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB.");

  // Start temporary server instance to test updated router
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(5099, resolve));
  console.log("Test HTTP server listening on port 5099.");

  const ts = Date.now();
  const testEmail = `todo3_user_${ts}@example.com`;

  try {
    // 1. Create a test unlinked user
    const testUser = await User.create({
      fullName: "Frontend Client Tester",
      email: testEmail,
      password: "TestPassword123!",
      roles: ["Employee"],
      isActive: true,
      employee: null,
    });

    // 2. Login as Admin to obtain session cookie
    const loginRes = await fetch("http://localhost:5099/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@peoplepay360.local",
        password: "AdminPassword2026!",
      }),
    });
    const cookieHeader = loginRes.headers.get("set-cookie");
    if (!loginRes.ok || !cookieHeader) {
      throw new Error(`Admin login failed with status ${loginRes.status}`);
    }
    const cookie = cookieHeader.split(";")[0];
    console.log("✓ Admin logged in, session cookie acquired.");

    // 3. Test GET /api/users/lookup for unlinked user with whitespace & uppercase
    console.log("\n[Test 1] Lookup unlinked user with whitespace & uppercase...");
    const url1 = `http://localhost:5099/api/users/lookup?email=${encodeURIComponent("  " + testEmail.toUpperCase() + "  ")}`;
    const res1 = await fetch(url1, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
    });
    const json1 = await res1.json();
    console.log("Status:", res1.status, "Payload:", JSON.stringify(json1));
    if (!res1.ok || json1.data.status !== "UNLINKED" || json1.data.user.fullName !== "Frontend Client Tester") {
      throw new Error("Test 1 Failed: Unlinked user lookup failed");
    }
    console.log("✓ Test 1 Passed: GET /api/users/lookup successfully returned UNLINKED user.");

    // 4. Test GET /api/users/lookup as HR Manager (Verifying RBAC for HR Manager)
    console.log("\n[Test 2] Login as HR Manager and test /api/users/lookup...");
    const hrLoginRes = await fetch("http://localhost:5099/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "hrmanager@peoplepay360.local",
        password: "HRManager2026!",
      }),
    });
    const hrCookie = hrLoginRes.headers.get("set-cookie").split(";")[0];
    const res2 = await fetch(url1, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Cookie: hrCookie,
      },
    });
    const json2 = await res2.json();
    console.log("Status:", res2.status, "Payload:", JSON.stringify(json2));
    if (!res2.ok || json2.data.status !== "UNLINKED") {
      throw new Error("Test 2 Failed: HR Manager was unable to access /api/users/lookup");
    }
    console.log("✓ Test 2 Passed: HR Manager successfully accessed /api/users/lookup.");

    // 5. Test that HR Manager is still FORBIDDEN on /api/users (Admin-only protection preserved)
    console.log("\n[Test 3] Verify HR Manager is FORBIDDEN on GET /api/users...");
    const res3 = await fetch("http://localhost:5099/api/users", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Cookie: hrCookie,
      },
    });
    console.log("Status:", res3.status);
    if (res3.status !== 403) {
      throw new Error(`Test 3 Failed: Expected 403 Forbidden for HR Manager on /api/users, got ${res3.status}`);
    }
    console.log("✓ Test 3 Passed: HR Manager is strictly blocked from general GET /api/users.");

    // 6. Test that Employee role is FORBIDDEN on /api/users/lookup
    console.log("\n[Test 4] Verify Employee is FORBIDDEN on /api/users/lookup...");
    const empLoginRes = await fetch("http://localhost:5099/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "employee@peoplepay360.local",
        password: "Employee2026!",
      }),
    });
    const empCookie = empLoginRes.headers.get("set-cookie").split(";")[0];
    const res4 = await fetch(url1, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Cookie: empCookie,
      },
    });
    console.log("Status:", res4.status);
    if (res4.status !== 403) {
      throw new Error(`Test 4 Failed: Expected 403 Forbidden for Employee on /api/users/lookup, got ${res4.status}`);
    }
    console.log("✓ Test 4 Passed: Employee role is strictly blocked from /api/users/lookup.");

    // Cleanup
    await User.deleteMany({ _id: testUser._id });
    console.log("\n✓ Test data cleaned up.");

    console.log("\n==================================================");
    console.log("   ALL TODO 3 API CLIENT & ROUTE TESTS PASSED!    ");
    console.log("==================================================");
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  } finally {
    server.close();
    await mongoose.disconnect();
  }
}

testClient();
