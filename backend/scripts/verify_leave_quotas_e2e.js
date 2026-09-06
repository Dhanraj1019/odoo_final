const mongoose = require("mongoose");
const http = require("http");
require("dotenv").config();

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let body = null;
        try {
          body = JSON.parse(data);
        } catch {
          body = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          cookies: res.headers["set-cookie"],
          body,
        });
      });
    });
    req.on("error", (err) => reject(err));
    if (postData) {
      req.write(typeof postData === "string" ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function login(email, password) {
  const res = await request(
    {
      hostname: "localhost",
      port: 5000,
      path: "/api/auth/login",
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
    { email, password }
  );
  const cookie = res.cookies ? res.cookies.map((c) => c.split(";")[0]).join("; ") : "";
  return { cookie, body: res.body, statusCode: res.statusCode };
}

async function runVerification() {
  console.log("================================================================================");
  console.log("   PEOPLEPAY360 — LEAVE QUOTA & BALANCES COMPREHENSIVE VERIFICATION");
  console.log("================================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  const ts = Date.now();
  const admin = await login("admin@peoplepay360.local", "AdminPassword2026!");
  const hrManager = await login("hrmanager@peoplepay360.local", "HRManager2026!");
  const employeeA = await login("employee@peoplepay360.local", "Employee2026!");

  assert(admin.statusCode === 200, "Admin logged in (200)");
  assert(hrManager.statusCode === 200, "HR Manager logged in (200)");
  assert(employeeA.statusCode === 200, "Employee A logged in (200)");

  // 1. Verify Database contains only canonical Leave Types
  console.log("\n1. Verifying Database TimeOffTypes...");
  const typesRes = await request({
    hostname: "localhost",
    port: 5000,
    path: "/api/time-off-types?status=Active",
    method: "GET",
    headers: { Cookie: employeeA.cookie },
  });
  const types = typesRes.body?.data?.timeOffTypes || typesRes.body?.timeOffTypes || [];
  assert(typesRes.statusCode === 200, "GET /api/time-off-types returned 200");
  
  const hasDummyType = types.some((t) => /AutoType|P20 Vacation/i.test(t.name));
  assert(!hasDummyType, `No AutoType or dummy test types found in database (Total active types: ${types.length})`);

  // 2. Test Employee A Allocations Scoping
  console.log("\n2. Testing Employee Allocations Retrieval & Scoping...");
  const allocResA = await request({
    hostname: "localhost",
    port: 5000,
    path: "/api/time-off-allocations",
    method: "GET",
    headers: { Cookie: employeeA.cookie },
  });
  assert(allocResA.statusCode === 200, "Employee A retrieved own allocations (200)");
  const allocsA = allocResA.body?.data?.allocations || allocResA.body?.allocations || [];
  console.log(`  Employee A has ${allocsA.length} approved allocations:`);
  allocsA.forEach((a) => {
    console.log(`   - ${a.timeOffType?.name}: Allocated ${a.allocatedAmount}, Taken ${a.takenAmount}, Remaining ${a.remainingAmount}`);
  });

  // 3. Security: Attempting to query another employee's allocations
  console.log("\n3. Testing Role Authorization & Employee Scoping Security...");
  const foreignAllocRes = await request({
    hostname: "localhost",
    port: 5000,
    path: `/api/time-off-allocations?employee=6a9be3ab66ff38af15d9122a`,
    method: "GET",
    headers: { Cookie: employeeA.cookie },
  });
  const foreignAllocs = foreignAllocRes.body?.data?.allocations || foreignAllocRes.body?.allocations || [];
  const empA_Id = employeeA.body?.data?.user?.employee?._id || employeeA.body?.user?.employee?._id || employeeA.body?.data?.user?.employee;
  const allMatchSelf = foreignAllocs.every((a) => (a.employee?._id || a.employee).toString() === empA_Id.toString());
  assert(allMatchSelf, "Backend strictly enforced authenticated employee identity against unauthorized ?employee= parameter");

  // 4. Test Complete Leave Lifecycle with Remaining Days Calculation
  console.log("\n4. Testing Leave Creation, Approval, and Quota Decrement...");
  const paidType = types.find((t) => t.name === "Paid Time Off");
  assert(Boolean(paidType), "Found canonical Paid Time Off type");

  // Create isolated employee & allocation to verify math
  const newEmpRes = await request(
    {
      hostname: "localhost",
      port: 5000,
      path: "/api/employees",
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: admin.cookie },
    },
    {
      fullName: `Test Quota Employee ${ts}`,
      email: `quota_emp_${ts}@test.local`,
      employeeType: "Full-Time",
    }
  );
  assert(newEmpRes.statusCode === 201, "Created test employee");
  const testEmpId = (newEmpRes.body?.data?.employee || newEmpRes.body?.employee)?._id;

  // Grant 20 days
  const grantAllocRes = await request(
    {
      hostname: "localhost",
      port: 5000,
      path: "/api/time-off-allocations",
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: hrManager.cookie },
    },
    {
      employee: testEmpId,
      timeOffType: paidType._id,
      allocatedAmount: 20,
    }
  );
  assert(grantAllocRes.statusCode === 201, "Created 20-day allocation for test employee");
  const testAllocId = (grantAllocRes.body?.data?.allocation || grantAllocRes.body?.allocation)?._id;

  // Approve allocation
  await request({
    hostname: "localhost",
    port: 5000,
    path: `/api/time-off-allocations/${testAllocId}/approve`,
    method: "PUT",
    headers: { Cookie: admin.cookie },
  });

  // HR submits 5-day request
  const reqRes = await request(
    {
      hostname: "localhost",
      port: 5000,
      path: "/api/time-off-requests",
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: hrManager.cookie },
    },
    {
      employee: testEmpId,
      timeOffType: paidType._id,
      startDate: "2026-11-02",
      endDate: "2026-11-06",
      duration: 5,
      reason: "5 day holiday",
    }
  );
  assert(reqRes.statusCode === 201, "Created 5-day leave request");
  const testReqId = (reqRes.body?.data?.request || reqRes.body?.request)?._id;

  // Approve request
  const appRes = await request({
    hostname: "localhost",
    port: 5000,
    path: `/api/time-off-requests/${testReqId}/approve`,
    method: "PUT",
    headers: { Cookie: hrManager.cookie },
  });
  assert(appRes.statusCode === 200, "HR approved leave request");

  // Check balance: Allocated: 20, Taken: 5, Remaining: 15
  const checkRes = await request({
    hostname: "localhost",
    port: 5000,
    path: `/api/time-off-allocations/${testAllocId}`,
    method: "GET",
    headers: { Cookie: admin.cookie },
  });
  const finalAlloc = checkRes.body?.data?.allocation || checkRes.body?.allocation;
  assert(finalAlloc.allocatedAmount === 20, `Allocated is 20 (got ${finalAlloc.allocatedAmount})`);
  assert(finalAlloc.takenAmount === 5, `Taken is 5 (got ${finalAlloc.takenAmount})`);
  assert(finalAlloc.remainingAmount === 15, `Remaining is 15 (got ${finalAlloc.remainingAmount})`);

  // 5. Clean up test records
  console.log("\n5. Cleaning up test records...");
  await request({ hostname: "localhost", port: 5000, path: `/api/time-off-requests/${testReqId}`, method: "DELETE", headers: { Cookie: admin.cookie } });
  await request({ hostname: "localhost", port: 5000, path: `/api/time-off-allocations/${testAllocId}`, method: "DELETE", headers: { Cookie: admin.cookie } });
  await request({ hostname: "localhost", port: 5000, path: `/api/employees/${testEmpId}`, method: "DELETE", headers: { Cookie: admin.cookie } });
  console.log("✓ Test records cleanly deleted");

  console.log("\n================================================================================");
  console.log(`   VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================\n");

  process.exit(failed > 0 ? 1 : 0);
}

runVerification().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
