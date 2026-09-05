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

async function runPhase18Tests() {
  console.log("================================================================");
  console.log("   PEOPLEPAY360 — PHASE 18 LIVE INTEGRATION & RBAC TESTS");
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

    // 2. Working Schedule Management
    console.log("\n2. Testing Working Schedules Management...");
    const schName = `Phase18_Schedule_${Date.now().toString().slice(-4)}`;
    const createSchPayload = {
      name: schName,
      company: "Acme Testing Corp",
      days: [
        { day: "Monday", startTime: "08:30", endTime: "17:30", breakMinutes: 60 },
        { day: "Tuesday", startTime: "08:30", endTime: "17:30", breakMinutes: 60 },
        { day: "Wednesday", startTime: "08:30", endTime: "17:30", breakMinutes: 60 },
        { day: "Thursday", startTime: "08:30", endTime: "17:30", breakMinutes: 60 },
        { day: "Friday", startTime: "08:30", endTime: "16:30", breakMinutes: 60 },
      ],
      status: "Active",
    };

    const createSchRes = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: "/api/working-schedules",
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: hrManager.cookie },
      },
      createSchPayload
    );

    assert(createSchRes.statusCode === 201, `Working schedule created (201): ${schName}`);
    const createdSch = createSchRes.body?.data?.workingSchedule;
    assert(
      createdSch?.totalWeeklyHours === 39,
      `Weekly hours auto-computed correctly: ${createdSch?.totalWeeklyHours} hrs (expected 39)`
    );

    // List Working Schedules
    const listSchRes = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/working-schedules",
      method: "GET",
      headers: { Cookie: payrollUser.cookie },
    });
    assert(listSchRes.statusCode === 200, "HR Payroll User can list working schedules (200)");

    // Soft Archive Working Schedule
    const archiveSchRes = await request({
      hostname: "localhost",
      port: 5000,
      path: `/api/working-schedules/${createdSch._id}`,
      method: "DELETE",
      headers: { Cookie: hrManager.cookie },
    });
    assert(archiveSchRes.statusCode === 200, "Working schedule archived successfully (200)");
    assert(archiveSchRes.body?.data?.workingSchedule?.status === "Archived", "Schedule status transitioned to Archived");

    // 3. Contracts Management
    console.log("\n3. Testing Contracts Management & Overlap Protection...");

    // Fetch existing employee and structures
    const empRes = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/employees",
      method: "GET",
      headers: { Cookie: hrManager.cookie },
    });
    const targetEmployee = empRes.body?.data?.employees?.[0];
    assert(Boolean(targetEmployee?._id), `Target employee selected: ${targetEmployee?.fullName}`);

    const contractRef1 = `CON_P18_${Date.now().toString().slice(-4)}_A`;
    const createContractPayload1 = {
      contractReference: contractRef1,
      employee: targetEmployee._id,
      startDate: "2027-01-01",
      endDate: "2027-06-30",
      wagePerMonth: 6500,
      status: "Active",
    };

    const createContractRes1 = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: "/api/contracts",
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: hrManager.cookie },
      },
      createContractPayload1
    );
    assert(createContractRes1.statusCode === 201, `Active Contract 1 created (201): ${contractRef1}`);
    const contract1 = createContractRes1.body?.data?.contract;

    // Test Active Overlap Conflict (Must return 409 Conflict)
    console.log("\n4. Testing Overlapping Active Contract Conflict Rejection...");
    const contractRefOverlap = `CON_P18_${Date.now().toString().slice(-4)}_OVERLAP`;
    const createOverlapPayload = {
      contractReference: contractRefOverlap,
      employee: targetEmployee._id,
      startDate: "2027-03-01", // Overlaps with 2027-01-01 to 2027-06-30
      endDate: "2027-12-31",
      wagePerMonth: 7000,
      status: "Active",
    };

    const overlapRes = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: "/api/contracts",
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: hrManager.cookie },
      },
      createOverlapPayload
    );
    assert(
      overlapRes.statusCode === 409,
      `Overlapping active contract rejected with 409 Conflict: got ${overlapRes.statusCode}`
    );

    // Test Draft Contract (Draft allows overlap without conflict)
    const draftPayload = {
      ...createOverlapPayload,
      status: "Draft",
    };
    const draftRes = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: "/api/contracts",
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: hrManager.cookie },
      },
      draftPayload
    );
    assert(draftRes.statusCode === 201, `Draft contract created without overlap blocker (201)`);
    const draftContract = draftRes.body?.data?.contract;

    // Test Update Contract
    const updateContractRes = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: `/api/contracts/${contract1._id}`,
        method: "PUT",
        headers: { "Content-Type": "application/json", Cookie: hrManager.cookie },
      },
      { wagePerMonth: 6800 }
    );
    assert(updateContractRes.statusCode === 200, "Contract wage updated successfully (200)");
    assert(updateContractRes.body?.data?.contract?.wagePerMonth === 6800, "Updated wage confirmed");

    // Test List Contracts with ?employee= filter
    const filterContractRes = await request({
      hostname: "localhost",
      port: 5000,
      path: `/api/contracts?employee=${targetEmployee._id}`,
      method: "GET",
      headers: { Cookie: hrManager.cookie },
    });
    assert(filterContractRes.statusCode === 200, "Filtered contracts by employee executed successfully (200)");
    const empContracts = filterContractRes.body?.data?.contracts || [];
    assert(
      empContracts.every((c) => (c.employee?._id || c.employee) === targetEmployee._id),
      "All returned contracts belong to the filtered employee"
    );

    // Clean up created test contracts
    await request({
      hostname: "localhost",
      port: 5000,
      path: `/api/contracts/${contract1._id}`,
      method: "DELETE",
      headers: { Cookie: hrManager.cookie },
    });
    if (draftContract?._id) {
      await request({
        hostname: "localhost",
        port: 5000,
        path: `/api/contracts/${draftContract._id}`,
        method: "DELETE",
        headers: { Cookie: hrManager.cookie },
      });
    }

    // 5. RBAC Protection on Employee Role
    console.log("\n5. Testing RBAC restrictions on Employee role...");
    const empContractsRes = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/contracts",
      method: "GET",
      headers: { Cookie: employee.cookie },
    });
    assert(empContractsRes.statusCode === 403, "Employee role blocked from /api/contracts (403)");

    const empSchedulesRes = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/working-schedules",
      method: "GET",
      headers: { Cookie: employee.cookie },
    });
    assert(empSchedulesRes.statusCode === 403, "Employee role blocked from /api/working-schedules (403)");

    console.log("\n================================================================");
    console.log(`   INTEGRATION TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("================================================================");

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error("Test execution failure:", err);
    process.exit(1);
  }
}

runPhase18Tests();
