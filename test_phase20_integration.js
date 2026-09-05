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

async function runPhase20Tests() {
  console.log("================================================================");
  console.log("   PEOPLEPAY360 — PHASE 20 TIME OFF LIVE INTEGRATION & RBAC TESTS");
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
    const hrPayrollManager = await login("payrollmanager@peoplepay360.local", "PayrollMgr2026!");
    const payrollUser = await login("payrolluser@peoplepay360.local", "PayrollUser2026!");
    const employee = await login("employee@peoplepay360.local", "Employee2026!");

    assert(admin.statusCode === 200, "Admin login successful (200)");
    assert(hrManager.statusCode === 200, "HR Manager login successful (200)");
    assert(hrPayrollManager.statusCode === 200, "HR Payroll Manager login successful (200)");
    assert(payrollUser.statusCode === 200, "HR Payroll User login successful (200)");
    assert(employee.statusCode === 200, "Employee login successful (200)");

    const employeeObj = employee.body?.data?.user?.employee || employee.body?.user?.employee;
    const employeeId = employeeObj?._id || employeeObj;
    console.log(`\n  Authenticated Employee ID: ${employeeId}`);

    // 2. Time Off Types Management
    console.log("\n2. Testing Time Off Types (CRUD & RBAC)...");
    const uniqueTypeName = `P20 Vacation ${Date.now()}`;
    const createTypeRes = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: "/api/time-off-types",
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: admin.cookie },
      },
      {
        name: uniqueTypeName,
        unit: "Days",
        isPaid: true,
        requiresAllocation: true,
        requiresApproval: true,
        status: "Active",
      }
    );
    assert(createTypeRes.statusCode === 201 || createTypeRes.statusCode === 200, `Admin created Time Off Type (Status: ${createTypeRes.statusCode})`);
    const createdType = createTypeRes.body?.data?.timeOffType || createTypeRes.body?.timeOffType || createTypeRes.body?.data;
    const typeId = createdType?._id;

    // RBAC: Employee attempting to create Time Off Type -> 403
    const empCreateTypeRes = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: "/api/time-off-types",
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: employee.cookie },
      },
      { name: "Unauthorized Type", unit: "Days" }
    );
    assert(empCreateTypeRes.statusCode === 403, `Employee cannot create Time Off Type (403 Forbidden: ${empCreateTypeRes.statusCode})`);

    // List Types
    const listTypesRes = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/time-off-types",
      method: "GET",
      headers: { Cookie: employee.cookie },
    });
    assert(listTypesRes.statusCode === 200, "Employees can list active Time Off Types (200)");

    // 3. Time Off Allocations Management
    console.log("\n3. Testing Time Off Allocations & Approvals...");
    const createAllocRes = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: "/api/time-off-allocations",
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: hrManager.cookie },
      },
      {
        employee: employeeId,
        timeOffType: typeId,
        allocatedAmount: 10,
        validFrom: "2026-01-01",
        validTo: "2026-12-31",
      }
    );
    assert(createAllocRes.statusCode === 201 || createAllocRes.statusCode === 200, `HR Manager created Allocation of 10 days (Status: ${createAllocRes.statusCode})`);
    const createdAlloc = createAllocRes.body?.data?.allocation || createAllocRes.body?.allocation || createAllocRes.body?.data;
    const allocId = createdAlloc?._id;

    // Approve Allocation
    const approveAllocRes = await request({
      hostname: "localhost",
      port: 5000,
      path: `/api/time-off-allocations/${allocId}/approve`,
      method: "PUT",
      headers: { Cookie: admin.cookie },
    });
    assert(approveAllocRes.statusCode === 200, `Admin approved Time Off Allocation (Status: ${approveAllocRes.statusCode})`);

    // RBAC: Employee cannot approve allocation
    const empApproveAllocRes = await request({
      hostname: "localhost",
      port: 5000,
      path: `/api/time-off-allocations/${allocId}/approve`,
      method: "PUT",
      headers: { Cookie: employee.cookie },
    });
    assert(empApproveAllocRes.statusCode === 403, `Employee cannot approve allocation (403 Forbidden: ${empApproveAllocRes.statusCode})`);

    // 4. Employee Leave Request Submission & Scoping
    console.log("\n4. Testing Leave Request Submission & HR Approval Workflow...");
    const submitReqRes = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: "/api/time-off-requests",
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: employee.cookie },
      },
      {
        employee: employeeId,
        timeOffType: typeId,
        startDate: "2026-10-05T00:00:00.000Z",
        endDate: "2026-10-06T00:00:00.000Z",
        reason: "Personal family event",
      }
    );
    assert(submitReqRes.statusCode === 201 || submitReqRes.statusCode === 200, `Employee submitted leave request for 2 days (Status: ${submitReqRes.statusCode})`);
    const createdReq = submitReqRes.body?.data?.request || submitReqRes.body?.request || submitReqRes.body?.data;
    const reqId = createdReq?._id;

    // HR Approval of Leave Request
    const approveReqRes = await request({
      hostname: "localhost",
      port: 5000,
      path: `/api/time-off-requests/${reqId}/approve`,
      method: "PUT",
      headers: { Cookie: hrManager.cookie },
    });
    assert(approveReqRes.statusCode === 200, `HR Manager approved Leave Request (Status: ${approveReqRes.statusCode})`);

    // Verify Allocation Deductions
    console.log("\n5. Testing Balance Deduction Verification...");
    const getAllocRes = await request({
      hostname: "localhost",
      port: 5000,
      path: `/api/time-off-allocations/${allocId}`,
      method: "GET",
      headers: { Cookie: admin.cookie },
    });
    const updatedAlloc = getAllocRes.body?.data?.allocation || getAllocRes.body?.allocation || getAllocRes.body?.data;
    const takenAmount = Number(updatedAlloc?.takenAmount || 0);
    assert(takenAmount > 0, `Allocation takenAmount was successfully incremented: ${takenAmount} days`);

    // 6. Excessive Leave Request & HTTP 409 Conflict
    console.log("\n6. Testing Insufficient Balance (HTTP 409 Conflict)...");
    const excessiveReqRes = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: "/api/time-off-requests",
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: employee.cookie },
      },
      {
        employee: employeeId,
        timeOffType: typeId,
        startDate: "2026-11-02T00:00:00.000Z",
        endDate: "2026-11-30T00:00:00.000Z", // ~21 working days > remaining 8 days
        reason: "Excessive vacation request",
      }
    );
    const excessiveReq = excessiveReqRes.body?.data?.request || excessiveReqRes.body?.request || excessiveReqRes.body?.data;
    const excessiveReqId = excessiveReq?._id;

    // Approving excessive request must return 409 Conflict
    const approveExcessiveRes = await request({
      hostname: "localhost",
      port: 5000,
      path: `/api/time-off-requests/${excessiveReqId}/approve`,
      method: "PUT",
      headers: { Cookie: hrManager.cookie },
    });
    assert(
      approveExcessiveRes.statusCode === 409,
      `Approving excessive leave request returned HTTP 409 Conflict (Status: ${approveExcessiveRes.statusCode})`
    );

    // Auto-approved type submission with insufficient balance
    const autoTypeName = `AutoType ${Date.now()}`;
    const autoTypeRes = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: "/api/time-off-types",
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: admin.cookie },
      },
      {
        name: autoTypeName,
        unit: "Days",
        isPaid: true,
        requiresAllocation: true,
        requiresApproval: false,
        status: "Active",
      }
    );
    const autoTypeId = (autoTypeRes.body?.data?.timeOffType || autoTypeRes.body?.timeOffType || autoTypeRes.body?.data)?._id;

    // Submitting with 0 allocations on auto-approved type -> returns 409
    const submitAutoExcessiveRes = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: "/api/time-off-requests",
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: employee.cookie },
      },
      {
        employee: employeeId,
        timeOffType: autoTypeId,
        startDate: "2026-11-02T00:00:00.000Z",
        endDate: "2026-11-03T00:00:00.000Z",
        reason: "Auto-approve excessive",
      }
    );
    assert(
      submitAutoExcessiveRes.statusCode === 409,
      `Submitting excessive request for auto-approved type returned HTTP 409 Conflict (${submitAutoExcessiveRes.statusCode})`
    );

    // 7. Refusal with Reason
    console.log("\n7. Testing Leave Refusal with Reason...");
    const submitReq2Res = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: "/api/time-off-requests",
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: employee.cookie },
      },
      {
        employee: employeeId,
        timeOffType: typeId,
        startDate: "2026-12-01T00:00:00.000Z",
        endDate: "2026-12-01T00:00:00.000Z",
        reason: "Winter leave request",
      }
    );
    const req2 = submitReq2Res.body?.data?.request || submitReq2Res.body?.request || submitReq2Res.body?.data;
    const req2Id = req2?._id;

    const refuseRes = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: `/api/time-off-requests/${req2Id}/refuse`,
        method: "PUT",
        headers: { "Content-Type": "application/json", Cookie: hrManager.cookie },
      },
      { reason: "Critical year-end project milestone" }
    );
    assert(refuseRes.statusCode === 200, `HR Manager refused request with reason (Status: ${refuseRes.statusCode})`);
    const refusedReq = refuseRes.body?.data?.request || refuseRes.body?.request || refuseRes.body?.data;
    assert(
      refusedReq?.status === "Refused" && (refusedReq?.reason || "").includes("Critical"),
      `Refusal status and reason persisted correctly ("${refusedReq?.reason}")`
    );

    // 8. Self-Service Scoping vs HR Workforce Access
    console.log("\n8. Testing Self-Service Scoping & Deep-link Filtering...");
    const empListReqRes = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/time-off-requests",
      method: "GET",
      headers: { Cookie: employee.cookie },
    });
    const empRequests = empListReqRes.body?.data?.requests || empListReqRes.body?.requests || [];
    const allBelongToSelf = empRequests.every(
      (r) => (r.employee?._id || r.employee) === employeeId
    );
    assert(allBelongToSelf, `Employee self-service list is properly scoped (Total: ${empRequests.length})`);

    const hrListReqRes = await request({
      hostname: "localhost",
      port: 5000,
      path: `/api/time-off-requests?employee=${employeeId}`,
      method: "GET",
      headers: { Cookie: hrManager.cookie },
    });
    assert(hrListReqRes.statusCode === 200, "HR can filter requests via ?employee=<id> deep link");

    // 9. Regression Checks (Phases 14–19)
    console.log("\n9. Testing Regression for Completed Phases (14–19)...");
    const meRes = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/auth/me",
      method: "GET",
      headers: { Cookie: employee.cookie },
    });
    assert(meRes.statusCode === 200, "Phase 14 & 15 Auth/Session intact (200)");

    const empDirRes = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/employees",
      method: "GET",
      headers: { Cookie: hrManager.cookie },
    });
    assert(empDirRes.statusCode === 200, "Phase 17 Employee Directory intact (200)");

    const contractsRes = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/contracts",
      method: "GET",
      headers: { Cookie: hrManager.cookie },
    });
    assert(contractsRes.statusCode === 200, "Phase 18 Contracts intact (200)");

    const schedulesRes = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/working-schedules",
      method: "GET",
      headers: { Cookie: hrManager.cookie },
    });
    assert(schedulesRes.statusCode === 200, "Phase 18 Working Schedules intact (200)");

    const attendanceRes = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/attendance",
      method: "GET",
      headers: { Cookie: hrManager.cookie },
    });
    assert(attendanceRes.statusCode === 200, "Phase 19 Attendance Logs intact (200)");

    // Summary
    console.log("\n================================================================");
    console.log(`   PHASE 20 VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("================================================================\n");

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error("Test execution failed:", err);
    process.exit(1);
  }
}

runPhase20Tests();
