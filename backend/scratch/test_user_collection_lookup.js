const http = require("http");
const mongoose = require("mongoose");
const User = require("../src/models/User");

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
  console.log("     TESTING USER COLLECTION EMAIL LOOKUP         ");
  console.log("==================================================\n");

  const timestamp = Date.now();
  const testAdminEmail = `admin_tester_${timestamp}@example.com`;
  const testTargetUserEmail = `target_user_${timestamp}@example.com`;
  const testPassword = "Password123!";

  // 1. Create test admin and target user in DB User collection
  const adminUser = new User({
    fullName: "Admin Tester",
    email: testAdminEmail,
    password: testPassword,
    roles: ["Admin"],
    isActive: true,
  });
  await adminUser.save();

  const targetUser = new User({
    fullName: "Nishu Yadav Target",
    email: testTargetUserEmail,
    password: testPassword,
    roles: ["Employee", "HR Payroll User"],
    isActive: true,
  });
  await targetUser.save();

  console.log("Created test database records in USER collection:");
  console.log(`- Admin: ${testAdminEmail}`);
  console.log(`- Target User: ${testTargetUserEmail} (Name: Nishu Yadav Target)\n`);

  try {
    const adminCookie = await loginUser(testAdminEmail, testPassword);

    // Test 1: Lookup existing user from User collection (Case-insensitive)
    console.log("[Test 1] Lookup existing user with exact email...");
    const lookupRes1 = await makeRequest(
      `/api/users/lookup?email=${encodeURIComponent(testTargetUserEmail)}`,
      "GET",
      null,
      { Cookie: adminCookie }
    );
    console.log("Status:", lookupRes1.status, "Body:", JSON.stringify(lookupRes1.body));
    if (lookupRes1.status !== 200 || !lookupRes1.body?.data?.found) {
      throw new Error("Test 1 Failed: User lookup from User collection failed");
    }
    if (lookupRes1.body.data.user.fullName !== "Nishu Yadav Target") {
      throw new Error(`Test 1 Failed: Full name mismatch: ${lookupRes1.body.data.user.fullName}`);
    }
    console.log("✓ Test 1 Passed: User correctly found in USER collection.\n");

    // Test 2: Case-insensitive lookup (uppercase input)
    console.log("[Test 2] Lookup existing user with uppercase email...");
    const lookupRes2 = await makeRequest(
      `/api/users/lookup?email=${encodeURIComponent(testTargetUserEmail.toUpperCase())}`,
      "GET",
      null,
      { Cookie: adminCookie }
    );
    console.log("Status:", lookupRes2.status, "Body:", JSON.stringify(lookupRes2.body));
    if (lookupRes2.status !== 200 || !lookupRes2.body?.data?.found) {
      throw new Error("Test 2 Failed: Case-insensitive User lookup failed");
    }
    console.log("✓ Test 2 Passed: Case-insensitive User search works seamlessly.\n");

    // Test 3: Lookup non-existent user in User collection
    console.log("[Test 3] Lookup non-existent email in User collection...");
    const lookupRes3 = await makeRequest(
      `/api/users/lookup?email=nonexistent_user_${timestamp}@example.com`,
      "GET",
      null,
      { Cookie: adminCookie }
    );
    console.log("Status:", lookupRes3.status, "Body:", JSON.stringify(lookupRes3.body));
    if (lookupRes3.status !== 200 || lookupRes3.body?.data?.found !== false) {
      throw new Error("Test 3 Failed: Expected found: false for non-existent user");
    }
    console.log("✓ Test 3 Passed: Non-existent user returns clean found: false state.\n");

    // Test 4: Check lookup on existing user nishu@gmailc.om if present
    const existingNishu = await User.findOne({ email: "nishu@gmailc.om" });
    if (existingNishu) {
      console.log("[Test 4] Testing lookup on existing DB user 'nishu@gmailc.om'...");
      const nishuRes = await makeRequest(
        `/api/users/lookup?email=nishu@gmailc.om`,
        "GET",
        null,
        { Cookie: adminCookie }
      );
      console.log("Status:", nishuRes.status, "Body:", JSON.stringify(nishuRes.body));
      if (nishuRes.status === 200 && nishuRes.body?.data?.found) {
        console.log("✓ Test 4 Passed: Found existing DB user 'nishu@gmailc.om' with name:", nishuRes.body.data.user.fullName);
      }
    }

    console.log("==================================================");
    console.log("   ALL USER COLLECTION LOOKUP TESTS PASSED!       ");
    console.log("==================================================");
  } finally {
    // Cleanup test records
    await User.deleteMany({ email: { $in: [testAdminEmail, testTargetUserEmail] } });
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
