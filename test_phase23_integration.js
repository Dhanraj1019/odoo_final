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

async function runPhase23Tests() {
  console.log("================================================================");
  console.log("   PEOPLEPAY360 — PHASE 23 DASHBOARD UI LIVE INTEGRATION & RBAC");
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

    // 2. Admin Dashboard (Full Scope Verification)
    console.log("\n2. Testing Admin Dashboard (Full Scope)...");
    const adminDash = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/dashboard",
      method: "GET",
      headers: { Cookie: admin.cookie },
    });
    assert(adminDash.statusCode === 200, "Admin dashboard retrieved (Status: 200)");
    const adminData = adminDash.body?.data || {};
    assert(adminData.scope === "full", `Admin receives "full" scope`);
    assert(typeof adminData.kpis?.totalNetSalaryPaid === "number", "Admin KPI: totalNetSalaryPaid present");
    assert(typeof adminData.kpis?.averageSalary === "number", "Admin KPI: averageSalary present");
    assert(typeof adminData.kpis?.payslipsGenerated === "number", "Admin KPI: payslipsGenerated present");
    assert(typeof adminData.kpis?.approvedTimeOffDays === "number", "Admin KPI: approvedTimeOffDays present");
    assert(typeof adminData.kpis?.attendanceHealthPercent === "number", "Admin KPI: attendanceHealthPercent present");
    assert(Array.isArray(adminData.charts?.salaryCostByDepartment), "Admin Chart: salaryCostByDepartment array present");
    assert(Array.isArray(adminData.charts?.monthlyNetSalaryTrend), "Admin Chart: monthlyNetSalaryTrend array present");
    assert(Array.isArray(adminData.alerts) && adminData.alerts.length >= 3, "Admin Alerts: Operational risk list present");
    assert(adminData.attendanceOverview && typeof adminData.attendanceOverview.present === "number", "Admin: Attendance overview present");
    assert(adminData.timeOffOverview && typeof adminData.timeOffOverview.approvedDays === "number", "Admin: Time off overview present");
    assert(
      Array.isArray(adminData.departmentBreakdown) &&
        adminData.departmentBreakdown.some((d) => d.totalSalary !== undefined),
      "Admin: Department breakdown includes totalSalary"
    );

    // 3. HR Payroll Roles (Full Scope Verification)
    console.log("\n3. Testing HR Payroll Manager & User Dashboard (Full Scope)...");
    const pmDash = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/dashboard",
      method: "GET",
      headers: { Cookie: hrPayrollManager.cookie },
    });
    assert(pmDash.statusCode === 200 && pmDash.body?.data?.scope === "full", "HR Payroll Manager receives full scope (200)");

    const puDash = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/dashboard",
      method: "GET",
      headers: { Cookie: hrPayrollUser.cookie },
    });
    assert(puDash.statusCode === 200 && puDash.body?.data?.scope === "full", "HR Payroll User receives full scope (200)");

    // 4. HR Manager Dashboard (HR Scope Verification — Financial Isolation)
    console.log("\n4. Testing HR Manager Dashboard (HR Scope — Zero Financial Leakage)...");
    const hrDash = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/dashboard",
      method: "GET",
      headers: { Cookie: hrManager.cookie },
    });
    assert(hrDash.statusCode === 200, "HR Manager dashboard retrieved (Status: 200)");
    const hrData = hrDash.body?.data || {};
    assert(hrData.scope === "hr", `HR Manager receives restricted "hr" scope`);
    assert(hrData.kpis?.totalNetSalaryPaid === undefined, "HR Scope: totalNetSalaryPaid is strictly omitted");
    assert(hrData.kpis?.averageSalary === undefined, "HR Scope: averageSalary is strictly omitted");
    assert(hrData.kpis?.payslipsGenerated === undefined, "HR Scope: payslipsGenerated is strictly omitted");
    assert(hrData.charts === undefined || hrData.charts === null, "HR Scope: Salary charts are strictly omitted");
    assert(typeof hrData.kpis?.approvedTimeOffDays === "number", "HR Scope: approvedTimeOffDays is available");
    assert(typeof hrData.kpis?.attendanceHealthPercent === "number", "HR Scope: attendanceHealthPercent is available");
    assert(
      Array.isArray(hrData.departmentBreakdown) &&
        hrData.departmentBreakdown.every((d) => d.totalSalary === undefined),
      "HR Scope: Department breakdown hides all salary numbers"
    );

    // 5. Employee Dashboard Rejection (403 Forbidden)
    console.log("\n5. Testing Employee RBAC Boundary (Forbidden)...");
    const empDash = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/dashboard",
      method: "GET",
      headers: { Cookie: employee.cookie },
    });
    assert(empDash.statusCode === 403, `Employee blocked from dashboard (Status: 403 Forbidden)`);

    // 6. Dashboard Filtering Verification
    console.log("\n6. Testing Dashboard Query Filters...");
    const filterPeriod = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/dashboard?period=2026-08",
      method: "GET",
      headers: { Cookie: admin.cookie },
    });
    assert(filterPeriod.statusCode === 200, "Dashboard filtered by period=2026-08 (200)");

    const filterType = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/dashboard?employeeType=Full-time",
      method: "GET",
      headers: { Cookie: admin.cookie },
    });
    assert(filterType.statusCode === 200, "Dashboard filtered by employeeType=Full-time (200)");

    // 7. Regression Testing for Completed Phases (14–22)
    console.log("\n7. Testing Regression for Completed Phases (14–22)...");
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

    console.log("\n================================================================");
    console.log(`   PHASE 23 VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("================================================================\n");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error("Test execution fatal error:", err);
    process.exit(1);
  }
}

runPhase23Tests();
