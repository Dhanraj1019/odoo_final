const http = require("http");

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: json,
          cookies: res.headers["set-cookie"],
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

async function runPhase19Tests() {
  console.log("================================================================");
  console.log("   PEOPLEPAY360 — PHASE 19 LIVE INTEGRATION & RBAC TESTS");
  console.log("================================================================\n");

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

  try {
    // 1. Authenticate Sessions
    console.log("1. Authenticating Roles...");
    const admin = await login("admin@peoplepay360.local", "AdminPassword2026!");
    const hrManager = await login("hrmanager@peoplepay360.local", "HRManager2026!");
    const payrollUser = await login("payrolluser@peoplepay360.local", "PayrollUser2026!");
    const employee = await login("employee@peoplepay360.local", "Employee2026!");

    assert(admin.statusCode === 200, "Admin login successful (200)");
    assert(hrManager.statusCode === 200, "HR Manager login successful (200)");
    assert(payrollUser.statusCode === 200, "HR Payroll User login successful (200)");
    assert(employee.statusCode === 200, "Employee login successful (200)");

    // 2. Self-Service Check-In / Check-Out
    console.log("\n2. Testing Employee Self-Service Check-In / Out...");
    const checkInRes = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/attendance/check-in",
      method: "POST",
      headers: { Cookie: employee.cookie },
    });
    assert(
      checkInRes.statusCode === 200 || checkInRes.statusCode === 409,
      `Employee check-in endpoint responded: ${checkInRes.statusCode}`
    );

    const checkOutRes = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/attendance/check-out",
      method: "POST",
      headers: { Cookie: employee.cookie },
    });
    assert(
      checkOutRes.statusCode === 200 || checkOutRes.statusCode === 409,
      `Employee check-out endpoint responded: ${checkOutRes.statusCode}`
    );

    // List attendances as Employee
    const empAttListRes = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/attendance",
      method: "GET",
      headers: { Cookie: employee.cookie },
    });
    assert(empAttListRes.statusCode === 200, "Employee can fetch own attendance records (200)");
    const empAttList = empAttListRes.body?.data?.attendances || [];
    assert(Array.isArray(empAttList), `Retrieved ${empAttList.length} self attendance records`);

    // 3. HR Workforce Attendance Directory & Filters
    console.log("\n3. Testing HR Workforce Attendance Directory & Query Filters...");
    const hrAttListRes = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/attendance",
      method: "GET",
      headers: { Cookie: hrManager.cookie },
    });
    assert(hrAttListRes.statusCode === 200, "HR Manager can fetch global workforce attendance (200)");
    const allRecords = hrAttListRes.body?.data?.attendances || [];
    assert(allRecords.length > 0, `Total workforce logs retrieved: ${allRecords.length}`);

    // Status filter
    const presentRes = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/attendance?status=Present",
      method: "GET",
      headers: { Cookie: hrManager.cookie },
    });
    assert(presentRes.statusCode === 200, "Filtered query by status=Present OK (200)");

    // 4. HR Manual Entry & Correction
    console.log("\n4. Testing HR Manual Attendance Entry & Corrections...");
    const employeesRes = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/employees",
      method: "GET",
      headers: { Cookie: hrManager.cookie },
    });
    const targetEmp = employeesRes.body?.data?.employees?.[0];
    assert(Boolean(targetEmp?._id), `Selected target employee: ${targetEmp?.fullName}`);

    const futureTestDate = "2027-11-15";
    const manualEntryPayload = {
      employee: targetEmp._id,
      date: futureTestDate,
      checkIn: `${futureTestDate}T09:00:00.000Z`,
      checkOut: `${futureTestDate}T17:30:00.000Z`,
      workedHours: 8.5,
      status: "Present",
      notes: "Phase 19 Audit test entry",
    };

    const manualCreateRes = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: "/api/attendance",
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: hrManager.cookie },
      },
      manualEntryPayload
    );
    assert(manualCreateRes.statusCode === 201, "Manual attendance created successfully (201)");
    const createdRecord = manualCreateRes.body?.data?.attendance;
    assert(createdRecord?.isManualCorrection === true, "Audit flag isManualCorrection set to true");
    assert(createdRecord?.workedHours === 8.5, "Worked hours persisted accurately (8.50)");

    // Update manual record
    const updateRes = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: `/api/attendance/${createdRecord._id}`,
        method: "PUT",
        headers: { "Content-Type": "application/json", Cookie: hrManager.cookie },
      },
      { status: "Late", notes: "Updated to Late Arrival during review" }
    );
    assert(updateRes.statusCode === 200, "Manual attendance updated successfully (200)");
    assert(updateRes.body?.data?.attendance?.status === "Late", "Updated status confirmed");

    // Clean up created record
    const deleteRes = await request({
      hostname: "localhost",
      port: 5000,
      path: `/api/attendance/${createdRecord._id}`,
      method: "DELETE",
      headers: { Cookie: hrManager.cookie },
    });
    assert(deleteRes.statusCode === 200, "Attendance record deleted successfully (200)");

    // 5. RBAC Protection
    console.log("\n5. Testing RBAC restrictions on Employee role for write endpoints...");
    const empManualCreateRes = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: "/api/attendance",
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: employee.cookie },
      },
      manualEntryPayload
    );
    assert(empManualCreateRes.statusCode === 403, "Employee blocked from manual POST /api/attendance (403)");

    console.log("\n================================================================");
    console.log(`   INTEGRATION TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("================================================================");

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error("Test error:", err);
    process.exit(1);
  }
}

runPhase19Tests();
