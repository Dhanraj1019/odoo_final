const http = require("http");

const BASE_URL = "http://localhost:5000";

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

async function runPhase17Tests() {
  console.log("================================================================");
  console.log("   PEOPLEPAY360 — PHASE 17 INTEGRATION & RBAC VERIFICATION");
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
    // 1. Authenticate as Admin
    console.log("1. Authenticating as Admin...");
    const adminAuth = await login("admin@peoplepay360.local", "AdminPassword2026!");
    assert(adminAuth.statusCode === 200, "Admin login successful (200)");

    // 2. Authenticate as HR Manager
    console.log("\n2. Authenticating as HR Manager...");
    const hrAuth = await login("hrmanager@peoplepay360.local", "HRManager2026!");
    assert(hrAuth.statusCode === 200, "HR Manager login successful (200)");

    // 3. Authenticate as Employee
    console.log("\n3. Authenticating as Employee...");
    const empAuth = await login("employee@peoplepay360.local", "Employee2026!");
    assert(empAuth.statusCode === 200, "Employee login successful (200)");

    // 4. Test GET /api/employees with HR Manager
    console.log("\n4. Testing GET /api/employees (HR Master Listing)...");
    const listRes = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/employees",
      method: "GET",
      headers: { Cookie: hrAuth.cookie },
    });
    assert(listRes.statusCode === 200, "GET /api/employees returns 200 for HR Manager");
    const employees = listRes.body?.data?.employees || [];
    assert(Array.isArray(employees) && employees.length > 0, `Retrieved ${employees.length} employee records`);

    // 5. Test Employee Role access control (Employee must NOT access /api/employees)
    console.log("\n5. Testing RBAC: Employee role access to /api/employees...");
    const empListRes = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/employees",
      method: "GET",
      headers: { Cookie: empAuth.cookie },
    });
    assert(
      empListRes.statusCode === 403,
      `Employee is forbidden (403) from accessing employee directory: got ${empListRes.statusCode}`
    );

    // 6. Test GET /api/employees/me (Self Service) for Employee
    console.log("\n6. Testing GET /api/employees/me for Employee role...");
    const meRes = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/employees/me",
      method: "GET",
      headers: { Cookie: empAuth.cookie },
    });
    assert(
      meRes.statusCode === 200 && meRes.body?.data?.employee,
      `Employee can retrieve linked self-profile: ${meRes.body?.data?.employee?.fullName || "OK"}`
    );

    // 7. Test References APIs for forms
    console.log("\n7. Testing Reference lookups (Departments, Positions, Schedules)...");
    const deptRes = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/departments",
      method: "GET",
      headers: { Cookie: hrAuth.cookie },
    });
    assert(deptRes.statusCode === 200, `Departments lookup OK (count: ${deptRes.body?.data?.departments?.length || 0})`);

    const posRes = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/job-positions",
      method: "GET",
      headers: { Cookie: hrAuth.cookie },
    });
    assert(posRes.statusCode === 200, `Job Positions lookup OK (count: ${posRes.body?.data?.jobPositions?.length || 0})`);

    const schRes = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/working-schedules",
      method: "GET",
      headers: { Cookie: hrAuth.cookie },
    });
    assert(schRes.statusCode === 200, `Working Schedules lookup OK (count: ${schRes.body?.data?.workingSchedules?.length || 0})`);

    // 8. Test Employee Creation with full schema
    console.log("\n8. Testing POST /api/employees (Employee Creation)...");
    const testCode = `P17_${Date.now().toString().slice(-4)}`;
    const testEmail = `test.employee.${Date.now()}@company.com`;
    const targetDept = deptRes.body?.data?.departments?.[0]?._id || null;
    const targetPos = posRes.body?.data?.jobPositions?.[0]?._id || null;
    const targetSch = schRes.body?.data?.workingSchedules?.[0]?._id || null;
    const managerEmp = employees[0]?._id || null;

    const createPayload = {
      fullName: "Phase Seventeen Test Employee",
      employeeCode: testCode,
      email: testEmail,
      phone: "+1-555-0199",
      department: targetDept,
      jobPosition: targetPos,
      manager: managerEmp,
      workingSchedule: targetSch,
      employeeType: "Full-Time",
      status: "Active",
      dateOfJoining: "2026-03-01",
      bankDetails: {
        accountNumber: "987654321098",
        ifscOrRoutingCode: "SBIN0001234",
        bankName: "Global Test Bank",
      },
    };

    const createRes = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: "/api/employees",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: hrAuth.cookie,
        },
      },
      createPayload
    );

    assert(createRes.statusCode === 201, `Employee created successfully (201): ${testCode}`);
    const createdEmp = createRes.body?.data?.employee;
    assert(createdEmp && createdEmp._id, `Created employee ID: ${createdEmp?._id}`);
    assert(createdEmp?.bankDetails?.bankName === "Global Test Bank", "Bank details persisted correctly");

    // 9. Test GET /api/employees/:id
    console.log("\n9. Testing GET /api/employees/:id (Employee Detail Hub)...");
    const detailRes = await request({
      hostname: "localhost",
      port: 5000,
      path: `/api/employees/${createdEmp._id}`,
      method: "GET",
      headers: { Cookie: hrAuth.cookie },
    });
    assert(detailRes.statusCode === 200, "Employee detail fetched successfully (200)");
    assert(detailRes.body?.data?.employee?.fullName === "Phase Seventeen Test Employee", "Employee name matches");

    // 10. Test PUT /api/employees/:id (Employee Update)
    console.log("\n10. Testing PUT /api/employees/:id (Update Profile)...");
    const updateRes = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: `/api/employees/${createdEmp._id}`,
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Cookie: hrAuth.cookie,
        },
      },
      {
        fullName: "Phase Seventeen Updated Name",
        phone: "+1-555-9999",
      }
    );
    assert(updateRes.statusCode === 200, "Employee updated successfully (200)");
    assert(updateRes.body?.data?.employee?.fullName === "Phase Seventeen Updated Name", "Updated name verified");

    // 11. Test DELETE /api/employees/:id (Soft Termination)
    console.log("\n11. Testing DELETE /api/employees/:id (Soft Termination)...");
    const termRes = await request({
      hostname: "localhost",
      port: 5000,
      path: `/api/employees/${createdEmp._id}`,
      method: "DELETE",
      headers: { Cookie: hrAuth.cookie },
    });
    assert(termRes.statusCode === 200, "Employee terminated successfully (200)");
    assert(termRes.body?.data?.employee?.status === "Terminated", "Employee status transitioned to 'Terminated'");

    // 12. Test Filter query parameter support
    console.log("\n12. Testing GET /api/employees with ?status=Terminated filter...");
    const filterRes = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/employees?status=Terminated",
      method: "GET",
      headers: { Cookie: hrAuth.cookie },
    });
    assert(filterRes.statusCode === 200, "Filtered query executed successfully");
    const terminatedList = filterRes.body?.data?.employees || [];
    assert(
      terminatedList.some((e) => e._id === createdEmp._id),
      "Terminated employee found in filtered query results"
    );

    console.log("\n================================================================");
    console.log(`   INTEGRATION VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("================================================================");

    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error("Test execution failed:", error);
    process.exit(1);
  }
}

runPhase17Tests();
