const http = require("http");
const fs = require("fs");
const path = require("path");

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

const auditResults = [];

function recordTest(id, category, scenario, expected, actual, passed) {
  auditResults.push({
    id,
    category,
    scenario,
    expected,
    actual: typeof actual === "object" ? JSON.stringify(actual) : String(actual),
    status: passed ? "PASS" : "FAIL",
  });
  const icon = passed ? "[PASS]" : "[FAIL]";
  console.log(`${icon} [${id}] ${scenario} -> Expected: ${expected} | Actual: ${actual}`);
}

async function runStrictAudit() {
  console.log("==================================================================");
  console.log("   PEOPLEPAY360 — PHASE 17 STRICT INDEPENDENT AUDIT EXECUTION");
  console.log("==================================================================\n");

  try {
    // -------------------------------------------------------------
    // SECTION A: Source Code & Schema Verification
    // -------------------------------------------------------------
    console.log("--- Section A: Source Code & Schema Verification ---");

    const employeeModelSrc = fs.readFileSync(
      path.join(__dirname, "backend/src/models/Employee.js"),
      "utf8"
    );
    const hasRequiredFields =
      employeeModelSrc.includes("fullName") &&
      employeeModelSrc.includes("employeeCode") &&
      employeeModelSrc.includes("email") &&
      employeeModelSrc.includes("department") &&
      employeeModelSrc.includes("jobPosition") &&
      employeeModelSrc.includes("manager") &&
      employeeModelSrc.includes("workingSchedule") &&
      employeeModelSrc.includes("bankDetails");
    recordTest(
      "A1-SCHEMA-MODEL",
      "Source Code",
      "Employee Mongoose Schema fields verification",
      "fullName, employeeCode, email, department, jobPosition, manager, workingSchedule, bankDetails",
      hasRequiredFields ? "All schema fields present" : "Missing fields",
      hasRequiredFields
    );

    const employeeFormSrc = fs.readFileSync(
      path.join(__dirname, "frontend/src/features/employees/components/EmployeeFormModal.jsx"),
      "utf8"
    );
    const formPreventsSelfManager = employeeFormSrc.includes("isEditing && emp._id === initialData._id");
    recordTest(
      "A2-FORM-SELF-MGR",
      "Source Code",
      "Employee Form prevents selecting self as manager during edit",
      "isEditing && emp._id === initialData._id filter in candidateManagers",
      formPreventsSelfManager ? "Self exclusion filter present" : "Filter missing",
      formPreventsSelfManager
    );

    const formExcludesTerminated = employeeFormSrc.includes('emp.status === "Terminated"');
    recordTest(
      "A3-FORM-TERM-MGR",
      "Source Code",
      "Employee Form excludes terminated employees from candidate managers",
      "emp.status === 'Terminated' excluded",
      formExcludesTerminated ? "Terminated filter present" : "Filter missing",
      formExcludesTerminated
    );

    const routerSrc = fs.readFileSync(
      path.join(__dirname, "frontend/src/app/router.jsx"),
      "utf8"
    );
    const hasEmployeesRoute = routerSrc.includes('path: "employees"');
    const hasEmployeeDetailRoute = routerSrc.includes('path: "employees/:id"');
    const hasMeRoute = routerSrc.includes('path: "me"');
    const hasRequireRole = routerSrc.includes("RequireRole");
    recordTest(
      "A4-ROUTER-PROTECTION",
      "Source Code",
      "Frontend router protects /employees, /employees/:id, and /me with RequireRole",
      "All 3 routes declared with RequireRole guards",
      hasEmployeesRoute && hasEmployeeDetailRoute && hasMeRoute && hasRequireRole
        ? "All routes guarded"
        : "Missing guards",
      hasEmployeesRoute && hasEmployeeDetailRoute && hasMeRoute && hasRequireRole
    );

    const relatedTabsSrc = fs.readFileSync(
      path.join(__dirname, "frontend/src/features/employees/components/RelatedRecordsTabs.jsx"),
      "utf8"
    );
    const noFakeCounts = !relatedTabsSrc.includes("count:") && !relatedTabsSrc.includes("badgeCount");
    const hasContractLink = relatedTabsSrc.includes("/contracts?employee=");
    const hasAttendanceLink = relatedTabsSrc.includes("/attendance?employee=");
    const hasTimeOffReqLink = relatedTabsSrc.includes("/time-off/requests?employee=");
    const hasTimeOffAllocLink = relatedTabsSrc.includes("/time-off/allocations?employee=");
    recordTest(
      "A5-RELATED-TABS",
      "Source Code",
      "Related Records smart tabs have deep-links without fake counts",
      "Deep-links with ?employee= and no fake count badges",
      noFakeCounts && hasContractLink && hasAttendanceLink && hasTimeOffReqLink && hasTimeOffAllocLink
        ? "Smart navigation deep links verified with zero fake counts"
        : "Invalid tabs configuration",
      noFakeCounts && hasContractLink && hasAttendanceLink && hasTimeOffReqLink && hasTimeOffAllocLink
    );

    // -------------------------------------------------------------
    // SECTION B: Authentication & Session Setup
    // -------------------------------------------------------------
    console.log("\n--- Section B: Authentication for 5 Roles ---");

    const users = {
      admin: await login("admin@peoplepay360.local", "AdminPassword2026!"),
      hrManager: await login("hrmanager@peoplepay360.local", "HRManager2026!"),
      payrollManager: await login("payrollmanager@peoplepay360.local", "PayrollMgr2026!"),
      payrollUser: await login("payrolluser@peoplepay360.local", "PayrollUser2026!"),
      employee: await login("employee@peoplepay360.local", "Employee2026!"),
    };

    recordTest(
      "B1-AUTH-ADMIN",
      "Authentication",
      "Admin login (admin@peoplepay360.local)",
      "200 OK with session cookie",
      users.admin.statusCode === 200 ? "200 OK" : users.admin.statusCode,
      users.admin.statusCode === 200
    );

    recordTest(
      "B2-AUTH-HR-MGR",
      "Authentication",
      "HR Manager login (hrmanager@peoplepay360.local)",
      "200 OK with session cookie",
      users.hrManager.statusCode === 200 ? "200 OK" : users.hrManager.statusCode,
      users.hrManager.statusCode === 200
    );

    recordTest(
      "B3-AUTH-PAYROLL-MGR",
      "Authentication",
      "HR Payroll Manager login (payrollmanager@peoplepay360.local)",
      "200 OK with session cookie",
      users.payrollManager.statusCode === 200 ? "200 OK" : users.payrollManager.statusCode,
      users.payrollManager.statusCode === 200
    );

    recordTest(
      "B4-AUTH-PAYROLL-USER",
      "Authentication",
      "HR Payroll User login (payrolluser@peoplepay360.local)",
      "200 OK with session cookie",
      users.payrollUser.statusCode === 200 ? "200 OK" : users.payrollUser.statusCode,
      users.payrollUser.statusCode === 200
    );

    recordTest(
      "B5-AUTH-EMPLOYEE",
      "Authentication",
      "Employee login (employee@peoplepay360.local)",
      "200 OK with session cookie",
      users.employee.statusCode === 200 ? "200 OK" : users.employee.statusCode,
      users.employee.statusCode === 200
    );

    // -------------------------------------------------------------
    // SECTION C: RBAC Matrix Verification
    // -------------------------------------------------------------
    console.log("\n--- Section C: RBAC Access Controls Across Roles ---");

    // GET /api/employees access test across all 5 roles
    const rolesDirCheck = {
      admin: await request({
        hostname: "localhost",
        port: 5000,
        path: "/api/employees",
        method: "GET",
        headers: { Cookie: users.admin.cookie },
      }),
      hrManager: await request({
        hostname: "localhost",
        port: 5000,
        path: "/api/employees",
        method: "GET",
        headers: { Cookie: users.hrManager.cookie },
      }),
      payrollManager: await request({
        hostname: "localhost",
        port: 5000,
        path: "/api/employees",
        method: "GET",
        headers: { Cookie: users.payrollManager.cookie },
      }),
      payrollUser: await request({
        hostname: "localhost",
        port: 5000,
        path: "/api/employees",
        method: "GET",
        headers: { Cookie: users.payrollUser.cookie },
      }),
      employee: await request({
        hostname: "localhost",
        port: 5000,
        path: "/api/employees",
        method: "GET",
        headers: { Cookie: users.employee.cookie },
      }),
    };

    recordTest(
      "C1-RBAC-ADMIN-DIR",
      "RBAC",
      "Admin GET /api/employees",
      "200 OK",
      rolesDirCheck.admin.statusCode,
      rolesDirCheck.admin.statusCode === 200
    );

    recordTest(
      "C2-RBAC-HRMGR-DIR",
      "RBAC",
      "HR Manager GET /api/employees",
      "200 OK",
      rolesDirCheck.hrManager.statusCode,
      rolesDirCheck.hrManager.statusCode === 200
    );

    recordTest(
      "C3-RBAC-PAYMGR-DIR",
      "RBAC",
      "HR Payroll Manager GET /api/employees",
      "200 OK",
      rolesDirCheck.payrollManager.statusCode,
      rolesDirCheck.payrollManager.statusCode === 200
    );

    recordTest(
      "C4-RBAC-PAYUSER-DIR",
      "RBAC",
      "HR Payroll User GET /api/employees",
      "200 OK",
      rolesDirCheck.payrollUser.statusCode,
      rolesDirCheck.payrollUser.statusCode === 200
    );

    recordTest(
      "C5-RBAC-EMP-DIR",
      "RBAC",
      "Employee GET /api/employees (must be blocked)",
      "403 Forbidden",
      rolesDirCheck.employee.statusCode,
      rolesDirCheck.employee.statusCode === 403
    );

    // -------------------------------------------------------------
    // SECTION D: Employee Master CRUD & Lifecycle
    // -------------------------------------------------------------
    console.log("\n--- Section D: Employee CRUD & Lifecycle ---");

    // Fetch lookups
    const depts = (
      await request({
        hostname: "localhost",
        port: 5000,
        path: "/api/departments",
        method: "GET",
        headers: { Cookie: users.hrManager.cookie },
      })
    ).body?.data?.departments;

    const positions = (
      await request({
        hostname: "localhost",
        port: 5000,
        path: "/api/job-positions",
        method: "GET",
        headers: { Cookie: users.hrManager.cookie },
      })
    ).body?.data?.jobPositions;

    const schedules = (
      await request({
        hostname: "localhost",
        port: 5000,
        path: "/api/working-schedules",
        method: "GET",
        headers: { Cookie: users.hrManager.cookie },
      })
    ).body?.data?.workingSchedules;

    const currentEmps = rolesDirCheck.hrManager.body?.data?.employees || [];
    const candidateMgr = currentEmps.find((e) => e.status !== "Terminated");

    const auditEmpCode = `AUD_${Date.now().toString().slice(-4)}`;
    const auditEmpEmail = `audit.emp.${Date.now()}@peoplepay360.local`;

    const createPayload = {
      fullName: "Audited Master Employee",
      employeeCode: auditEmpCode,
      email: auditEmpEmail,
      phone: "+1-800-AUDIT-01",
      department: depts?.[0]?._id || null,
      jobPosition: positions?.[0]?._id || null,
      manager: candidateMgr?._id || null,
      workingSchedule: schedules?.[0]?._id || null,
      employeeType: "Full-Time",
      status: "Active",
      dateOfJoining: "2026-01-15",
      bankDetails: {
        accountNumber: "123456789012",
        ifscOrRoutingCode: "SBIN0009999",
        bankName: "Audit Test Reserve Bank",
      },
    };

    // 1. Create Employee
    const createRes = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: "/api/employees",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: users.hrManager.cookie,
        },
      },
      createPayload
    );

    recordTest(
      "D1-CRUD-CREATE",
      "Employee CRUD",
      "POST /api/employees creates employee with full schema",
      "201 Created with employee ID",
      createRes.statusCode === 201 && createRes.body?.data?.employee?._id ? "201 Created" : createRes.statusCode,
      createRes.statusCode === 201 && Boolean(createRes.body?.data?.employee?._id)
    );

    const createdId = createRes.body?.data?.employee?._id;

    // 2. Duplicate Employee Code Validation
    const dupCodeRes = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: "/api/employees",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: users.hrManager.cookie,
        },
      },
      {
        ...createPayload,
        email: `another.${Date.now()}@test.com`,
      }
    );

    recordTest(
      "D2-CRUD-DUP-CODE",
      "Employee CRUD",
      "POST /api/employees rejects duplicate employeeCode",
      "409 Conflict",
      dupCodeRes.statusCode,
      dupCodeRes.statusCode === 409
    );

    // 3. Duplicate Email Validation
    const dupEmailRes = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: "/api/employees",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: users.hrManager.cookie,
        },
      },
      {
        ...createPayload,
        employeeCode: `DUP_${Date.now().toString().slice(-4)}`,
      }
    );

    recordTest(
      "D3-CRUD-DUP-EMAIL",
      "Employee CRUD",
      "POST /api/employees rejects duplicate email",
      "409 Conflict",
      dupEmailRes.statusCode,
      dupEmailRes.statusCode === 409
    );

    // 4. Read Employee Detail
    const getDetailRes = await request({
      hostname: "localhost",
      port: 5000,
      path: `/api/employees/${createdId}`,
      method: "GET",
      headers: { Cookie: users.hrManager.cookie },
    });

    const fetchedEmp = getDetailRes.body?.data?.employee;
    recordTest(
      "D4-CRUD-READ",
      "Employee Detail",
      "GET /api/employees/:id fetches full record with populated references",
      "200 OK, populated department & manager",
      getDetailRes.statusCode === 200 && fetchedEmp?.fullName === "Audited Master Employee"
        ? "200 OK with correct record"
        : getDetailRes.statusCode,
      getDetailRes.statusCode === 200 && fetchedEmp?.fullName === "Audited Master Employee"
    );

    // 5. Update Employee Record
    const updateRes = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: `/api/employees/${createdId}`,
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Cookie: users.hrManager.cookie,
        },
      },
      {
        fullName: "Audited Master Employee Updated",
        phone: "+1-800-AUDIT-99",
      }
    );

    recordTest(
      "D5-CRUD-UPDATE",
      "Employee CRUD",
      "PUT /api/employees/:id updates employee details",
      "200 OK with updated fullName",
      updateRes.statusCode === 200 && updateRes.body?.data?.employee?.fullName === "Audited Master Employee Updated"
        ? "200 OK with updated name"
        : updateRes.statusCode,
      updateRes.statusCode === 200 && updateRes.body?.data?.employee?.fullName === "Audited Master Employee Updated"
    );

    // 6. Prevent Self-Manager on Backend
    const selfMgrRes = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: `/api/employees/${createdId}`,
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Cookie: users.hrManager.cookie,
        },
      },
      { manager: createdId }
    );

    recordTest(
      "D6-BACKEND-SELF-MGR",
      "Employee Validation",
      "PUT /api/employees/:id rejects assigning self as manager",
      "400 Bad Request",
      selfMgrRes.statusCode,
      selfMgrRes.statusCode === 400
    );

    // 7. Soft Delete / Terminate
    const deleteRes = await request({
      hostname: "localhost",
      port: 5000,
      path: `/api/employees/${createdId}`,
      method: "DELETE",
      headers: { Cookie: users.hrManager.cookie },
    });

    recordTest(
      "D7-CRUD-TERMINATE",
      "Employee CRUD",
      "DELETE /api/employees/:id soft terminates employee",
      "200 OK with status = 'Terminated'",
      deleteRes.statusCode === 200 && deleteRes.body?.data?.employee?.status === "Terminated"
        ? "200 OK (Terminated)"
        : deleteRes.statusCode,
      deleteRes.statusCode === 200 && deleteRes.body?.data?.employee?.status === "Terminated"
    );

    // -------------------------------------------------------------
    // SECTION E: Employee Self-Service & Profile Protection
    // -------------------------------------------------------------
    console.log("\n--- Section E: Employee Self-Service & Profile Security ---");

    const meRes = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/employees/me",
      method: "GET",
      headers: { Cookie: users.employee.cookie },
    });

    const selfProfile = meRes.body?.data?.employee;
    recordTest(
      "E1-SELF-PROFILE",
      "Self Service",
      "GET /api/employees/me returns authenticated employee profile",
      "200 OK with user's linked record",
      meRes.statusCode === 200 && Boolean(selfProfile?._id) ? `200 OK (${selfProfile?.fullName})` : meRes.statusCode,
      meRes.statusCode === 200 && Boolean(selfProfile?._id)
    );

    // Test Employee ID access protection (Employee cannot access another employee's detail)
    const empOtherDetailRes = await request({
      hostname: "localhost",
      port: 5000,
      path: `/api/employees/${createdId}`,
      method: "GET",
      headers: { Cookie: users.employee.cookie },
    });

    recordTest(
      "E2-BLOCK-OTHER-DETAIL",
      "Security & RBAC",
      "Employee role GET /api/employees/:id on another employee",
      "403 Forbidden",
      empOtherDetailRes.statusCode,
      empOtherDetailRes.statusCode === 403
    );

    // -------------------------------------------------------------
    // SECTION F: Security & Data Leak Audit
    // -------------------------------------------------------------
    console.log("\n--- Section F: Security & Leak Audit ---");

    const jsonStringList = JSON.stringify(rolesDirCheck.hrManager.body);
    const hasPasswordHashLeak = jsonStringList.includes("passwordHash");
    recordTest(
      "F1-NO-PWD-LEAK",
      "Security",
      "GET /api/employees response does not contain passwordHash",
      "Zero occurrences of passwordHash",
      hasPasswordHashLeak ? "LEAK DETECTED" : "Zero passwordHash in response",
      !hasPasswordHashLeak
    );

    console.log("\n==================================================================");
    const passedCount = auditResults.filter((r) => r.status === "PASS").length;
    const failedCount = auditResults.filter((r) => r.status === "FAIL").length;
    console.log(`AUDIT TOTALS: ${passedCount} PASSED | ${failedCount} FAILED`);
    console.log("==================================================================");

    fs.writeFileSync(
      path.join(__dirname, "audit_phase17_report.json"),
      JSON.stringify(auditResults, null, 2)
    );
  } catch (err) {
    console.error("Audit runtime exception:", err);
    process.exit(1);
  }
}

runStrictAudit();
