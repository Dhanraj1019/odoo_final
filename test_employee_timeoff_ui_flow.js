/**
 * test_employee_timeoff_ui_flow.js
 * Dedicated verification test suite for Employee Time Off Creation Fix and RBAC boundary enforcement.
 */

const http = require("http");

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
          body,
        });
      });
    });

    req.on("error", reject);

    if (postData) {
      req.write(typeof postData === "string" ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

function extractCookie(headers) {
  const setCookie = headers["set-cookie"];
  if (!setCookie) return null;
  const cookieStr = Array.isArray(setCookie) ? setCookie[0] : setCookie;
  return cookieStr.split(";")[0];
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

  return {
    statusCode: res.statusCode,
    cookie: extractCookie(res.headers),
    user: res.body?.data?.user || res.body?.user,
  };
}

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
  } else {
    console.error(`  [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runEmployeeTimeOffTests() {
  console.log("================================================================================");
  console.log("   PEOPLEPAY360 — EMPLOYEE TIME OFF CREATION & RBAC DEDICATED VERIFICATION");
  console.log("================================================================================\n");

  const ts = Date.now();

  try {
    // 1. Employee Authentication & Identity Inspection
    console.log("1. Testing Employee Authentication & Identity Resolution...");
    const empSession = await login("employee@peoplepay360.local", "Employee2026!");
    assert(empSession.statusCode === 200, "Employee logged in successfully (200)");
    assert(Boolean(empSession.cookie), "Employee received session cookie");
    
    const empUser = empSession.user;
    assert(Array.isArray(empUser.roles) && empUser.roles.includes("Employee"), "User roles contains 'Employee'");
    
    // Check linked employee reference
    const empId = empUser.employee?._id || (typeof empUser.employee === "string" ? empUser.employee : empUser.employeeId);
    assert(Boolean(empId), `Authenticated user has linked employee ID: ${empId}`);

    // Verify session user via /api/auth/me
    const meRes = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/auth/me",
      method: "GET",
      headers: { Cookie: empSession.cookie },
    });
    assert(meRes.statusCode === 200, "GET /api/auth/me responded with 200");
    const meUser = meRes.body?.data?.user || meRes.body?.user;
    assert(Boolean(meUser?.employee), "Session user contains populated employee data");

    // 2. Strict Employee RBAC Directory Isolation
    console.log("\n2. Verifying Employee Directory RBAC Boundary...");
    const empDirRes = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/employees",
      method: "GET",
      headers: { Cookie: empSession.cookie },
    });
    assert(empDirRes.statusCode === 403, "Employee role blocked from GET /api/employees (403 Forbidden)");

    // 3. Time Off Types Retrieval & Response Structure
    console.log("\n3. Testing Time Off Types API Response Contract...");
    const typesRes = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/time-off-types?status=Active",
      method: "GET",
      headers: { Cookie: empSession.cookie },
    });
    assert(typesRes.statusCode === 200, "Employee permitted on GET /api/time-off-types (200 OK)");
    const timeOffTypes = typesRes.body?.data?.timeOffTypes || typesRes.body?.timeOffTypes;
    assert(Array.isArray(timeOffTypes) && timeOffTypes.length > 0, `Received ${timeOffTypes.length} active time off types`);

    // Admin creates a clean unique Time Off Type requiring approval
    const adminSession = await login("admin@peoplepay360.local", "AdminPassword2026!");
    assert(adminSession.statusCode === 200, "Admin logged in successfully");

    const newTypeRes = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: "/api/time-off-types",
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: adminSession.cookie },
      },
      {
        name: `Vacation Leave ${ts}`,
        unit: "Days",
        requiresAllocation: true,
        requiresApproval: true,
        isPaid: true,
        status: "Active",
      }
    );
    assert(newTypeRes.statusCode === 201, "Admin created isolated Time Off Type requiring approval (201)");
    const targetType = newTypeRes.body?.data?.timeOffType || newTypeRes.body?.timeOffType;
    const targetTypeId = targetType._id;
    assert(Boolean(targetTypeId), `Target leave type created: ${targetType.name} (${targetTypeId})`);

    // 4. Admin Setup: Ensure Quota Allocation Exists for Employee
    console.log("\n4. Admin Grants Quota Allocation to Target Employee...");

    const allocRes = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: "/api/time-off-allocations",
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: adminSession.cookie },
      },
      {
        employee: empId,
        timeOffType: targetTypeId,
        allocatedAmount: 10,
        validityStart: "2026-01-01",
        validityEnd: "2026-12-31",
      }
    );
    assert(allocRes.statusCode === 201, "Admin created 10-day quota allocation (201)");
    const allocId = allocRes.body?.data?.allocation?._id || allocRes.body?.allocation?._id;

    // Approve allocation
    const appAllocRes = await request({
      hostname: "localhost",
      port: 5000,
      path: `/api/time-off-allocations/${allocId}/approve`,
      method: "PUT",
      headers: { Cookie: adminSession.cookie },
    });
    assert(appAllocRes.statusCode === 200, "Admin approved allocation (200)");

    // 5. Employee Self-Service Leave Request (Omitting employee field)
    console.log("\n5. Testing Employee Self-Service Request Submission...");
    const empLeaveRes = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: "/api/time-off-requests",
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: empSession.cookie },
      },
      {
        timeOffType: targetTypeId,
        startDate: "2026-11-02",
        endDate: "2026-11-03",
        duration: 2,
        reason: `Self-service employee submission test ${ts}`,
      }
    );
    assert(empLeaveRes.statusCode === 201, "Employee submitted leave request without passing employee field (201)");
    const createdReq = empLeaveRes.body?.data?.request || empLeaveRes.body?.request;
    const reqEmpId = createdReq?.employee?._id || createdReq?.employee;
    assert(reqEmpId.toString() === empId.toString(), "Backend automatically bound request ownership to authenticated employee ID");

    // 6. Malicious Employee ID Override Attempt
    console.log("\n6. Testing Malicious Employee Ownership Override Prevention...");
    // Create a dummy department/employee or use HR manager ID
    const hrSession = await login("hrmanager@peoplepay360.local", "HRManager2026!");
    const hrEmpListRes = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/employees",
      method: "GET",
      headers: { Cookie: hrSession.cookie },
    });
    const allEmps = hrEmpListRes.body?.data?.employees || [];
    const otherEmp = allEmps.find((e) => e._id !== empId);
    assert(Boolean(otherEmp), `Found another employee for override test: ${otherEmp?.fullName}`);

    const exploitRes = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: "/api/time-off-requests",
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: empSession.cookie },
      },
      {
        employee: otherEmp._id, // Attempting to create for someone else
        timeOffType: targetTypeId,
        startDate: "2026-11-09",
        endDate: "2026-11-10",
        duration: 2,
        reason: `Exploit override attempt ${ts}`,
      }
    );
    assert(exploitRes.statusCode === 201, "Request processed by backend");
    const exploitReq = exploitRes.body?.data?.request || exploitRes.body?.request;
    const boundId = (exploitReq?.employee?._id || exploitReq?.employee).toString();
    assert(boundId === empId.toString(), "Security verified: Backend ignored foreign employee ID and strictly enforced authenticated employee ID");
    assert(boundId !== otherEmp._id.toString(), "Other employee was not assigned the request");

    // 7. HR/Admin Request Creation for Selected Employee
    console.log("\n7. Testing HR Manager Workforce Request Creation...");
    const hrCreateRes = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: "/api/time-off-requests",
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: hrSession.cookie },
      },
      {
        employee: empId,
        timeOffType: targetTypeId,
        startDate: "2026-11-16",
        endDate: "2026-11-17",
        duration: 2,
        reason: `HR proxy submission on behalf of employee ${ts}`,
      }
    );
    assert(hrCreateRes.statusCode === 201, "HR Manager successfully created request for selected employee (201)");
    const hrReq = hrCreateRes.body?.data?.request || hrCreateRes.body?.request;
    const hrReqId = hrReq?._id;

    // 8. HR Approval & Quota Decrement
    console.log("\n8. Testing HR Approval & Balance Decrement Workflow...");
    const approveRes = await request({
      hostname: "localhost",
      port: 5000,
      path: `/api/time-off-requests/${hrReqId}/approve`,
      method: "PUT",
      headers: { Cookie: hrSession.cookie },
    });
    assert(approveRes.statusCode === 200, "HR Manager approved leave request (200)");

    // Check allocation balance
    const checkAllocRes = await request({
      hostname: "localhost",
      port: 5000,
      path: `/api/time-off-allocations/${allocId}`,
      method: "GET",
      headers: { Cookie: adminSession.cookie },
    });
    const updatedAlloc = checkAllocRes.body?.data?.allocation || checkAllocRes.body?.allocation;
    assert(updatedAlloc.takenAmount === 2, `Allocation takenAmount successfully updated to 2 days (actual: ${updatedAlloc.takenAmount})`);

    // 9. Over-Quota Protection (HTTP 409 Conflict)
    console.log("\n9. Testing Over-Quota Rejection with HTTP 409 Conflict...");
    // Remaining balance is 10 - 2 = 8 days. Request 15 days.
    const excessReqRes = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: "/api/time-off-requests",
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: empSession.cookie },
      },
      {
        timeOffType: targetTypeId,
        startDate: "2026-12-01",
        endDate: "2026-12-20",
        duration: 15,
        reason: "Excessive leave beyond quota",
      }
    );
    assert(excessReqRes.statusCode === 201, "Excessive request submitted for HR review (201)");
    const excessReqId = excessReqRes.body?.data?.request?._id || excessReqRes.body?.request?._id;

    const excessApproveRes = await request({
      hostname: "localhost",
      port: 5000,
      path: `/api/time-off-requests/${excessReqId}/approve`,
      method: "PUT",
      headers: { Cookie: hrSession.cookie },
    });
    assert(excessApproveRes.statusCode === 409, `Approval of over-quota request rejected with HTTP 409 Conflict (got ${excessApproveRes.statusCode})`);

    // 10. Multi-Role User Safety Check
    console.log("\n10. Testing Multi-Role User Safety...");
    const multiUserEmail = `multi_role_${ts}@peoplepay360.local`;
    const multiUserPass = "MultiPass2026!";
    const createMultiRes = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: "/api/users",
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: adminSession.cookie },
      },
      {
        fullName: `Multi-Role User ${ts}`,
        email: multiUserEmail,
        password: multiUserPass,
        roles: ["HR Manager", "Employee"],
        employeeId: empId,
      }
    );
    assert(createMultiRes.statusCode === 201, "Created user with dual roles: ['HR Manager', 'Employee'] (201)");

    const multiSession = await login(multiUserEmail, multiUserPass);
    assert(multiSession.statusCode === 200, "Dual-role user logged in successfully (200)");
    
    // A user with HR Manager + Employee must have HR Manager capabilities (can list employees)
    const multiDirRes = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/employees",
      method: "GET",
      headers: { Cookie: multiSession.cookie },
    });
    assert(multiDirRes.statusCode === 200, "Multi-role user with HR Manager role can list employees (200)");

    console.log("\n================================================================================");
    console.log("   DEDICATED EMPLOYEE TIME OFF VERIFICATION: ALL 24 ASSERTIONS PASSED (100%)");
    console.log("================================================================================\n");
  } catch (err) {
    console.error("Test execution failed:", err);
    process.exit(1);
  }
}

runEmployeeTimeOffTests();
