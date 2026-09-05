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

async function runPhase24Tests() {
  console.log("================================================================");
  console.log("   PEOPLEPAY360 — PHASE 24 ADMIN USER MANAGEMENT INTEGRATION & RBAC");
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
    // 1. Authenticate All 5 Roles
    console.log("1. Authenticating Roles...");
    const admin = await login("admin@peoplepay360.local", "AdminPassword2026!");
    const hrPayrollManager = await login("payrollmanager@peoplepay360.local", "PayrollMgr2026!");
    const hrPayrollUser = await login("payrolluser@peoplepay360.local", "PayrollUser2026!");
    const hrManager = await login("hrmanager@peoplepay360.local", "HRManager2026!");
    const employee = await login("employee@peoplepay360.local", "Employee2026!");

    assert(admin.statusCode === 200, "Admin login successful (200)");
    assert(hrPayrollManager.statusCode === 200, "HR Payroll Manager login successful (200)");
    assert(hrPayrollUser.statusCode === 200, "HR Payroll User login successful (200)");
    assert(hrManager.statusCode === 200, "HR Manager login successful (200)");
    assert(employee.statusCode === 200, "Employee login successful (200)");

    // 2. Admin User Directory Listing & Search
    console.log("\n2. Testing User Directory Listing & Query Filters...");
    const listRes = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/users",
      method: "GET",
      headers: { Cookie: admin.cookie },
    });
    assert(listRes.statusCode === 200, "Admin retrieved user accounts list (200)");
    const users = listRes.body?.data?.users || listRes.body?.users || [];
    assert(users.length >= 5, `Found ${users.length} registered system users`);
    assert(
      users.every((u) => u.passwordHash === undefined),
      "Security verification: passwordHash is strictly excluded from all user responses"
    );

    const filterRoleRes = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/users?role=Admin",
      method: "GET",
      headers: { Cookie: admin.cookie },
    });
    assert(filterRoleRes.statusCode === 200, "Filtered users by role=Admin (200)");

    const filterStatusRes = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/users?status=active",
      method: "GET",
      headers: { Cookie: admin.cookie },
    });
    assert(filterStatusRes.statusCode === 200, "Filtered users by status=active (200)");

    // 3. User Provisioning (POST /api/users) with Multi-Role Assignment
    console.log("\n3. Testing User Provisioning & Multi-Role Assignment...");
    const ts = Date.now();
    const testEmail = `testuser_${ts}@peoplepay360.local`;
    const initialPassword = `TestPass_${ts}!`;

    const createRes = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: "/api/users",
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: admin.cookie },
      },
      {
        fullName: `Test Operative ${ts}`,
        email: testEmail,
        password: initialPassword,
        roles: ["HR Manager", "HR Payroll User"],
      }
    );
    assert(createRes.statusCode === 201, `Admin created user with multi-role assignment (Status: 201)`);
    const createdUser = createRes.body?.data?.user || createRes.body?.user;
    const createdUserId = createdUser?._id;
    assert(createdUser?.roles?.length === 2, `User has 2 assigned roles: ${createdUser?.roles?.join(", ")}`);

    // Verify new user can log in
    const testUserLogin = await login(testEmail, initialPassword);
    assert(testUserLogin.statusCode === 200, "New user logged in successfully with assigned credentials (200)");

    // 4. Duplicate Email Conflict Rejection (409 Conflict)
    console.log("\n4. Testing Duplicate Email 409 Conflict Rejection...");
    const duplicateRes = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: "/api/users",
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: admin.cookie },
      },
      {
        fullName: "Duplicate User",
        email: testEmail,
        password: "SomePassword123!",
        roles: ["Employee"],
      }
    );
    assert(duplicateRes.statusCode === 409, `Duplicate email properly rejected with HTTP 409 Conflict (Status: ${duplicateRes.statusCode})`);

    // 5. User Account Update & Employee Linking (PUT /api/users/:id)
    console.log("\n5. Testing User Account Update & Employee Linking...");
    // Fetch an employee to link
    const empListRes = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/employees",
      method: "GET",
      headers: { Cookie: admin.cookie },
    });
    const employeesList = empListRes.body?.data?.employees || empListRes.body?.employees || [];
    const targetEmpId = employeesList[0]?._id;

    const updateRes = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: `/api/users/${createdUserId}`,
        method: "PUT",
        headers: { "Content-Type": "application/json", Cookie: admin.cookie },
      },
      {
        fullName: `Updated Operative ${ts}`,
        roles: ["HR Payroll Manager", "HR Manager", "Employee"],
        employeeId: targetEmpId,
      }
    );
    assert(updateRes.statusCode === 200, "Admin updated user account & linked employee (200)");
    const updatedUser = updateRes.body?.data?.user || updateRes.body?.user;
    assert(updatedUser?.roles?.length === 3, "Updated user roles array preserved (3 roles)");

    // 6. Admin Password Reset (PUT /api/users/:id/reset-password)
    console.log("\n6. Testing Administrator Password Reset Override...");
    const newPassword = `NewResetPass_${ts}!`;
    const resetRes = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: `/api/users/${createdUserId}/reset-password`,
        method: "PUT",
        headers: { "Content-Type": "application/json", Cookie: admin.cookie },
      },
      { newPassword }
    );
    assert(resetRes.statusCode === 200, "Admin reset user password successfully (200)");

    // Verify user can log in with new password
    const loginWithNewPass = await login(testEmail, newPassword);
    assert(loginWithNewPass.statusCode === 200, "User successfully logged in with newly reset password (200)");

    // Test password too short rejection (< 6 chars)
    const shortPassRes = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: `/api/users/${createdUserId}/reset-password`,
        method: "PUT",
        headers: { "Content-Type": "application/json", Cookie: admin.cookie },
      },
      { newPassword: "123" }
    );
    assert(shortPassRes.statusCode === 400, "Short password (<6 chars) properly rejected with 400 Bad Request (400)");

    // 7. Soft Deactivation & Reactivation Lifecycle
    console.log("\n7. Testing Account Deactivation & Reactivation Lifecycle...");
    // Deactivate user
    const deleteRes = await request({
      hostname: "localhost",
      port: 5000,
      path: `/api/users/${createdUserId}`,
      method: "DELETE",
      headers: { Cookie: admin.cookie },
    });
    assert(deleteRes.statusCode === 200, "User account soft deactivated (Status: 200)");
    const deactivatedUser = deleteRes.body?.data?.user || deleteRes.body?.user;
    assert(deactivatedUser?.isActive === false, `User isActive state is false`);

    // Reactivate user
    const reactivateRes = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: `/api/users/${createdUserId}`,
        method: "PUT",
        headers: { "Content-Type": "application/json", Cookie: admin.cookie },
      },
      { isActive: true }
    );
    assert(reactivateRes.statusCode === 200, "User account reactivated via PUT (Status: 200)");
    const reactivatedUser = reactivateRes.body?.data?.user || reactivateRes.body?.user;
    assert(reactivatedUser?.isActive === true, "User isActive state restored to true");

    // 8. Strict Admin-Only RBAC Boundary Enforcement
    console.log("\n8. Testing Strict Admin-Only RBAC Boundary Enforcement...");
    const hrMgrAttempt = await request({ hostname: "localhost", port: 5000, path: "/api/users", method: "GET", headers: { Cookie: hrManager.cookie } });
    assert(hrMgrAttempt.statusCode === 403, "HR Manager blocked from /api/users (403 Forbidden: 403)");

    const hrPayMgrAttempt = await request({ hostname: "localhost", port: 5000, path: "/api/users", method: "GET", headers: { Cookie: hrPayrollManager.cookie } });
    assert(hrPayMgrAttempt.statusCode === 403, "HR Payroll Manager blocked from /api/users (403 Forbidden: 403)");

    const hrPayUserAttempt = await request({ hostname: "localhost", port: 5000, path: "/api/users", method: "GET", headers: { Cookie: hrPayrollUser.cookie } });
    assert(hrPayUserAttempt.statusCode === 403, "HR Payroll User blocked from /api/users (403 Forbidden: 403)");

    const empAttempt = await request({ hostname: "localhost", port: 5000, path: "/api/users", method: "GET", headers: { Cookie: employee.cookie } });
    assert(empAttempt.statusCode === 403, "Employee blocked from /api/users (403 Forbidden: 403)");

    // 9. Regression Testing for Completed Phases (14–23)
    console.log("\n9. Testing Regression for Completed Phases (14–23)...");
    const p14Auth = await request({ hostname: "localhost", port: 5000, path: "/api/auth/me", method: "GET", headers: { Cookie: admin.cookie } });
    assert(p14Auth.statusCode === 200, "Phase 14 & 15 Auth/Session intact (200)");

    const p17Emp = await request({ hostname: "localhost", port: 5000, path: "/api/employees", method: "GET", headers: { Cookie: admin.cookie } });
    assert(p17Emp.statusCode === 200, "Phase 17 Employee Directory intact (200)");

    const p18Contracts = await request({ hostname: "localhost", port: 5000, path: "/api/contracts", method: "GET", headers: { Cookie: admin.cookie } });
    assert(p18Contracts.statusCode === 200, "Phase 18 Contracts intact (200)");

    const p18Schedules = await request({ hostname: "localhost", port: 5000, path: "/api/working-schedules", method: "GET", headers: { Cookie: admin.cookie } });
    assert(p18Schedules.statusCode === 200, "Phase 18 Working Schedules intact (200)");

    const p19Attendance = await request({ hostname: "localhost", port: 5000, path: "/api/attendance", method: "GET", headers: { Cookie: admin.cookie } });
    assert(p19Attendance.statusCode === 200, "Phase 19 Attendance Logs intact (200)");

    const p20TimeOff = await request({ hostname: "localhost", port: 5000, path: "/api/time-off-requests", method: "GET", headers: { Cookie: admin.cookie } });
    assert(p20TimeOff.statusCode === 200, "Phase 20 Time Off module intact (200)");

    const p21SalaryRules = await request({ hostname: "localhost", port: 5000, path: "/api/salary-rules", method: "GET", headers: { Cookie: admin.cookie } });
    assert(p21SalaryRules.statusCode === 200, "Phase 21 Salary Rules intact (200)");

    const p22Payruns = await request({ hostname: "localhost", port: 5000, path: "/api/payruns", method: "GET", headers: { Cookie: admin.cookie } });
    assert(p22Payruns.statusCode === 200, "Phase 22 Payruns intact (200)");

    const p22Payslips = await request({ hostname: "localhost", port: 5000, path: "/api/payslips", method: "GET", headers: { Cookie: admin.cookie } });
    assert(p22Payslips.statusCode === 200, "Phase 22 Payslips intact (200)");

    const p23Dashboard = await request({ hostname: "localhost", port: 5000, path: "/api/dashboard", method: "GET", headers: { Cookie: admin.cookie } });
    assert(p23Dashboard.statusCode === 200, "Phase 23 Dashboard intact (200)");

    console.log("\n================================================================");
    console.log(`   PHASE 24 VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("================================================================\n");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error("Test execution fatal error:", err);
    process.exit(1);
  }
}

runPhase24Tests();
