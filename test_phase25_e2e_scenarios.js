const http = require("http");

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = "";
      const isPdf = res.headers["content-type"] && res.headers["content-type"].includes("application/pdf");

      if (isPdf) {
        let byteLength = 0;
        res.on("data", (chunk) => (byteLength += chunk.length));
        res.on("end", () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: { pdfBytes: byteLength },
            cookies: res.headers["set-cookie"],
          });
        });
        return;
      }

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

async function runPhase25E2ESuite() {
  console.log("================================================================================");
  console.log("   PEOPLEPAY360 — PHASE 25 OFFICIAL HACKATHON E2E DEMO SCENARIOS & FINAL AUDIT");
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

  try {
    // 1. Role Authentication
    console.log("1. Authenticating All 5 Canonical Roles...");
    const admin = await login("admin@peoplepay360.local", "AdminPassword2026!");
    const hrPayrollManager = await login("payrollmanager@peoplepay360.local", "PayrollMgr2026!");
    const hrPayrollUser = await login("payrolluser@peoplepay360.local", "PayrollUser2026!");
    const hrManager = await login("hrmanager@peoplepay360.local", "HRManager2026!");
    const employee = await login("employee@peoplepay360.local", "Employee2026!");

    assert(admin.statusCode === 200, "Admin authentication verified (200)");
    assert(hrPayrollManager.statusCode === 200, "HR Payroll Manager authentication verified (200)");
    assert(hrPayrollUser.statusCode === 200, "HR Payroll User authentication verified (200)");
    assert(hrManager.statusCode === 200, "HR Manager authentication verified (200)");
    assert(employee.statusCode === 200, "Employee authentication verified (200)");

    // =========================================================================
    // SCENARIO 1: FULL EMPLOYEE TO PAYSLIP LIFECYCLE
    // =========================================================================
    console.log("\n================================================================================");
    console.log("2. SCENARIO 1: Full Employee-to-Payslip Lifecycle");
    console.log("================================================================================");

    // 1A. Department & Job Position
    const deptRes = await request(
      { hostname: "localhost", port: 5000, path: "/api/departments", method: "POST", headers: { "Content-Type": "application/json", Cookie: admin.cookie } },
      { name: `E2E Tech Dept ${ts}`, code: `D_${String(ts).slice(-8)}` }
    );
    assert(deptRes.statusCode === 201, "Created unique Department (201)");
    const departmentId = deptRes.body?.data?.department?._id || deptRes.body?.department?._id;

    const jobRes = await request(
      { hostname: "localhost", port: 5000, path: "/api/job-positions", method: "POST", headers: { "Content-Type": "application/json", Cookie: admin.cookie } },
      { name: `Senior Architect ${ts}`, department: departmentId }
    );
    assert(jobRes.statusCode === 201, "Created unique Job Position (201)");
    const jobPositionId = jobRes.body?.data?.jobPosition?._id || jobRes.body?.jobPosition?._id;

    // 1B. Working Schedule Setup (Mon-Fri 9:00-17:00, 40 hrs/wk)
    const scheduleRes = await request(
      { hostname: "localhost", port: 5000, path: "/api/working-schedules", method: "POST", headers: { "Content-Type": "application/json", Cookie: admin.cookie } },
      {
        name: `E2E Standard 40h Schedule ${ts}`,
        days: [
          { day: "Monday", isWorkDay: true, startTime: "09:00", endTime: "17:00", breakDurationMinutes: 0 },
          { day: "Tuesday", isWorkDay: true, startTime: "09:00", endTime: "17:00", breakDurationMinutes: 0 },
          { day: "Wednesday", isWorkDay: true, startTime: "09:00", endTime: "17:00", breakDurationMinutes: 0 },
          { day: "Thursday", isWorkDay: true, startTime: "09:00", endTime: "17:00", breakDurationMinutes: 0 },
          { day: "Friday", isWorkDay: true, startTime: "09:00", endTime: "17:00", breakDurationMinutes: 0 },
        ],
      }
    );
    assert(scheduleRes.statusCode === 201, "Created Working Schedule with computed weekly hours (201)");
    const scheduleId = scheduleRes.body?.data?.workingSchedule?._id || scheduleRes.body?.workingSchedule?._id;

    // 1C. Employee Master Creation
    const empEmail = `e2e_staff_${ts}@peoplepay360.local`;
    const empCode = `E_${String(ts).slice(-8)}`;
    const empRes = await request(
      { hostname: "localhost", port: 5000, path: "/api/employees", method: "POST", headers: { "Content-Type": "application/json", Cookie: hrManager.cookie } },
      {
        fullName: `Dr. Alan Turing ${ts}`,
        employeeCode: empCode,
        email: empEmail,
        department: departmentId,
        jobPosition: jobPositionId,
        workingSchedule: scheduleId,
        employeeType: "Full-Time",
        dateOfJoining: "2026-01-01",
        bankDetails: {
          accountNumber: `AC${ts}`.slice(0, 16),
          bankName: "State Bank of India",
          ifscOrRoutingCode: "SBIN0001234",
        },
      }
    );
    assert(empRes.statusCode === 201, "HR Manager created new Employee master record (201)");
    const newEmp = empRes.body?.data?.employee || empRes.body?.employee;
    const newEmpId = newEmp?._id;

    // 1D. Salary Rules Creation (Fixed, Percentage, Formula)
    const ruleBasicRes = await request(
      { hostname: "localhost", port: 5000, path: "/api/salary-rules", method: "POST", headers: { "Content-Type": "application/json", Cookie: hrPayrollManager.cookie } },
      { name: `Basic Wage ${ts}`, code: `BASIC_${ts}`, category: "Basic", sequence: 10, computationMethod: "Fixed", fixedAmount: 60000, status: "Active" }
    );
    assert(ruleBasicRes.statusCode === 201, "Created Fixed Salary Rule BASIC (201)");
    const ruleBasicId = ruleBasicRes.body?.data?.salaryRule?._id || ruleBasicRes.body?.salaryRule?._id;

    const ruleHraRes = await request(
      { hostname: "localhost", port: 5000, path: "/api/salary-rules", method: "POST", headers: { "Content-Type": "application/json", Cookie: hrPayrollManager.cookie } },
      { name: `House Rent Allowance ${ts}`, code: `HRA_${ts}`, category: "Allowance", sequence: 20, computationMethod: "Percentage", percentageOf: `BASIC_${ts}`, percentageValue: 20, status: "Active" }
    );
    assert(ruleHraRes.statusCode === 201, "Created Percentage Salary Rule HRA (20% of BASIC) (201)");
    const ruleHraId = ruleHraRes.body?.data?.salaryRule?._id || ruleHraRes.body?.salaryRule?._id;

    const rulePfRes = await request(
      { hostname: "localhost", port: 5000, path: "/api/salary-rules", method: "POST", headers: { "Content-Type": "application/json", Cookie: hrPayrollManager.cookie } },
      { name: `Provident Fund ${ts}`, code: `PF_${ts}`, category: "Deduction", sequence: 30, computationMethod: "Formula", formulaExpression: `BASIC_${ts} * 0.12`, status: "Active" }
    );
    assert(rulePfRes.statusCode === 201, "Created Formula Salary Rule PF (12% of BASIC) (201)");
    const rulePfId = rulePfRes.body?.data?.salaryRule?._id || rulePfRes.body?.salaryRule?._id;

    const ruleGrossRes = await request(
      { hostname: "localhost", port: 5000, path: "/api/salary-rules", method: "POST", headers: { "Content-Type": "application/json", Cookie: hrPayrollManager.cookie } },
      { name: `Gross Earnings ${ts}`, code: `GROSS_${ts}`, category: "Gross", sequence: 40, computationMethod: "Formula", formulaExpression: `BASIC_${ts} + HRA_${ts}`, status: "Active" }
    );
    assert(ruleGrossRes.statusCode === 201, "Created Formula Salary Rule GROSS (BASIC + HRA) (201)");
    const ruleGrossId = ruleGrossRes.body?.data?.salaryRule?._id || ruleGrossRes.body?.salaryRule?._id;

    const ruleNetRes = await request(
      { hostname: "localhost", port: 5000, path: "/api/salary-rules", method: "POST", headers: { "Content-Type": "application/json", Cookie: hrPayrollManager.cookie } },
      { name: `Net Payout ${ts}`, code: `NET_${ts}`, category: "Net", sequence: 50, computationMethod: "Formula", formulaExpression: `GROSS_${ts} - PF_${ts}`, status: "Active" }
    );
    assert(ruleNetRes.statusCode === 201, "Created Formula Salary Rule NET (GROSS - PF) (201)");
    const ruleNetId = ruleNetRes.body?.data?.salaryRule?._id || ruleNetRes.body?.salaryRule?._id;

    // 1E. Salary Structure Setup
    const structRes = await request(
      { hostname: "localhost", port: 5000, path: "/api/salary-structures", method: "POST", headers: { "Content-Type": "application/json", Cookie: hrPayrollManager.cookie } },
      {
        name: `E2E Executive Compensation Structure ${ts}`,
        description: "5-Rule ordered execution structure",
        rules: [ruleBasicId, ruleHraId, rulePfId, ruleGrossId, ruleNetId],
        status: "Active",
      }
    );
    assert(structRes.statusCode === 201, "Created Salary Structure with 5 sequenced rules (201)");
    const structureId = structRes.body?.data?.salaryStructure?._id || structRes.body?.salaryStructure?._id;

    // 1F. Active Contract Creation
    const contractRes = await request(
      { hostname: "localhost", port: 5000, path: "/api/contracts", method: "POST", headers: { "Content-Type": "application/json", Cookie: hrManager.cookie } },
      {
        employee: newEmpId,
        department: departmentId,
        jobPosition: jobPositionId,
        workingSchedule: scheduleId,
        salaryStructure: structureId,
        wagePerMonth: 60000,
        startDate: "2026-09-01",
        endDate: "2026-12-31",
        status: "Active",
      }
    );
    assert(contractRes.statusCode === 201, "Created Active Contract for Employee linking Structure & Wage (201)");

    // 1G. Attendance Entry
    const attRes = await request(
      { hostname: "localhost", port: 5000, path: "/api/attendance", method: "POST", headers: { "Content-Type": "application/json", Cookie: hrManager.cookie } },
      {
        employee: newEmpId,
        date: "2026-09-01",
        checkIn: "2026-09-01T09:00:00.000Z",
        checkOut: "2026-09-01T17:00:00.000Z",
        status: "Present",
      }
    );
    assert(attRes.statusCode === 201, "Recorded valid shift attendance entry (201)");

    // 1H. 2-Step Payrun Creation Wizard
    const periodStart = "2026-09-01";
    const periodEnd = "2026-09-30";
    const candRes = await request({
      hostname: "localhost",
      port: 5000,
      path: `/api/payruns/eligible-employees?salaryStructure=${structureId}&periodStart=${periodStart}&periodEnd=${periodEnd}`,
      method: "GET",
      headers: { Cookie: hrPayrollManager.cookie },
    });
    assert(candRes.statusCode === 200, "Step 2 Wizard: Queried eligible employee candidates (200)");
    const candidates = candRes.body?.data?.candidates || candRes.body?.candidates || [];
    const matchedCand = candidates.find((c) => (c.employee?._id || c._id) === newEmpId);
    assert(Boolean(matchedCand), "Candidate query successfully resolved new employee with valid active contract");

    const payrunRes = await request(
      { hostname: "localhost", port: 5000, path: "/api/payruns", method: "POST", headers: { "Content-Type": "application/json", Cookie: hrPayrollManager.cookie } },
      {
        name: `E2E September 2026 Payrun ${ts}`,
        salaryStructure: structureId,
        periodStart,
        periodEnd,
        employeeType: "All",
        selectedEmployees: [newEmpId],
      }
    );
    assert(payrunRes.statusCode === 201, "Created Payrun batch in Draft state (201)");
    const createdRun = payrunRes.body?.data?.payrun || payrunRes.body?.payrun;
    const payrunId = createdRun?._id;

    // 1I. Payrun Lifecycle Processing: Compute -> Validate -> Mark Paid
    const compRes = await request({
      hostname: "localhost",
      port: 5000,
      path: `/api/payruns/${payrunId}/compute`,
      method: "POST",
      headers: { Cookie: hrPayrollManager.cookie },
    });
    assert(compRes.statusCode === 200, "Compute Payrun: Formula engine calculated all salary rules (200)");

    const valRes = await request({
      hostname: "localhost",
      port: 5000,
      path: `/api/payruns/${payrunId}/validate`,
      method: "POST",
      headers: { Cookie: hrPayrollManager.cookie },
    });
    assert(valRes.statusCode === 200, "Validate Payrun: Payslip computation lines frozen & validated (200)");

    const markPaidRes = await request({
      hostname: "localhost",
      port: 5000,
      path: `/api/payruns/${payrunId}/mark-paid`,
      method: "POST",
      headers: { Cookie: hrPayrollManager.cookie },
    });
    assert(markPaidRes.statusCode === 200, "Mark Paid: Payrun & Payslips transitioned to Paid with timestamp (200)");
    const paidRun = markPaidRes.body?.data?.payrun || markPaidRes.body?.payrun;
    assert(paidRun?.status === "Paid" && Boolean(paidRun?.paidAt), "Payrun record confirms Paid status and paidAt timestamp");

    // 1J. Payslip Line Inspection & PDF Streaming
    const slipsRes = await request({
      hostname: "localhost",
      port: 5000,
      path: `/api/payslips?payrun=${payrunId}`,
      method: "GET",
      headers: { Cookie: hrPayrollManager.cookie },
    });
    assert(slipsRes.statusCode === 200, "Queried payslip record for payrun (200)");
    const payslips = slipsRes.body?.data?.payslips || slipsRes.body?.payslips || [];
    assert(payslips.length === 1, "Exactly 1 payslip generated for selected employee");
    const e2ePayslip = payslips[0];
    const payslipId = e2ePayslip?._id;

    const slipDetailRes = await request({
      hostname: "localhost",
      port: 5000,
      path: `/api/payslips/${payslipId}`,
      method: "GET",
      headers: { Cookie: hrPayrollManager.cookie },
    });
    assert(slipDetailRes.statusCode === 200, "Retrieved detailed payslip with itemized rule breakdown (200)");
    const slipDetail = slipDetailRes.body?.data?.payslip || slipDetailRes.body?.payslip;
    assert(slipDetail.lines && slipDetail.lines.length === 5, `Payslip contains all 5 rule lines (Basic, HRA, PF, GROSS, NET)`);
    assert(slipDetail.grossSalary === 72000, `Calculated Gross: ₹72,000 (Basic 60k + HRA 12k) matches actual ₹${slipDetail.grossSalary}`);
    assert(slipDetail.netSalary === 64800, `Calculated Net: ₹64,800 (Gross 72k - PF 7.2k) matches actual ₹${slipDetail.netSalary}`);

    // Stream Printable PDF
    const pdfRes = await request({
      hostname: "localhost",
      port: 5000,
      path: `/api/payslips/${payslipId}/pdf`,
      method: "GET",
      headers: { Cookie: hrPayrollManager.cookie },
    });
    assert(pdfRes.statusCode === 200, "PDF streaming endpoint returned HTTP 200");
    assert((pdfRes.headers["content-type"] || "").includes("application/pdf"), "Content-Type is valid application/pdf");
    assert(pdfRes.body?.pdfBytes > 1000, `Binary PDF stream received (${pdfRes.body?.pdfBytes} bytes)`);

    // 1K. Dashboard Real-Time Propagation
    const dashRes = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/dashboard?period=2026-09",
      method: "GET",
      headers: { Cookie: admin.cookie },
    });
    assert(dashRes.statusCode === 200, "Dashboard aggregated September 2026 payroll data (200)");
    const dashData = dashRes.body?.data || {};
    assert(dashData.kpis?.totalNetSalaryPaid >= 64800, `Dashboard reflects new disbursement (Total: ₹${dashData.kpis?.totalNetSalaryPaid})`);

    // =========================================================================
    // SCENARIO 2: TIME OFF ALLOCATION & REQUEST LIFECYCLE
    // =========================================================================
    console.log("\n================================================================================");
    console.log("3. SCENARIO 2: Time Off Allocation-to-Request Lifecycle");
    console.log("================================================================================");

    // 2A. Create Time Off Type
    const typeRes = await request(
      { hostname: "localhost", port: 5000, path: "/api/time-off-types", method: "POST", headers: { "Content-Type": "application/json", Cookie: admin.cookie } },
      {
        name: `Paid Earned Leave ${ts}`,
        code: `EL_${String(ts).slice(-7)}`,
        unit: "Days",
        requiresApproval: true,
        requiresAllocation: true,
        isPaid: true,
        status: "Active",
      }
    );
    assert(typeRes.statusCode === 201, "Created Time Off Type with allocation requirement (201)");
    const timeOffTypeId = typeRes.body?.data?.timeOffType?._id || typeRes.body?.timeOffType?._id;

    // 2B. Grant Quota Allocation (15 Days)
    const allocRes = await request(
      { hostname: "localhost", port: 5000, path: "/api/time-off-allocations", method: "POST", headers: { "Content-Type": "application/json", Cookie: hrManager.cookie } },
      {
        employee: newEmpId,
        timeOffType: timeOffTypeId,
        allocatedAmount: 15,
        validityStart: "2026-01-01",
        validityEnd: "2026-12-31",
      }
    );
    assert(allocRes.statusCode === 201, "Created 15-day Quota Allocation for employee (201)");
    const allocId = allocRes.body?.data?.allocation?._id || allocRes.body?.allocation?._id;

    // 2C. Approve Allocation
    const appAllocRes = await request({
      hostname: "localhost",
      port: 5000,
      path: `/api/time-off-allocations/${allocId}/approve`,
      method: "PUT",
      headers: { Cookie: admin.cookie },
    });
    assert(appAllocRes.statusCode === 200, "Admin approved Quota Allocation (200)");

    // 2D. Create Login User Account for this Employee
    const empUserPass = `EmpUserPass_${ts}!`;
    const createUserRes = await request(
      { hostname: "localhost", port: 5000, path: "/api/users", method: "POST", headers: { "Content-Type": "application/json", Cookie: admin.cookie } },
      {
        fullName: `Dr. Alan Turing ${ts}`,
        email: empEmail,
        password: empUserPass,
        roles: ["Employee"],
        employeeId: newEmpId,
      }
    );
    assert(createUserRes.statusCode === 201, "Provisioned linked Employee User Account (201)");
    const empSession = await login(empEmail, empUserPass);
    assert(empSession.statusCode === 200, "Employee logged in successfully (200)");

    // 2E. Employee Submits Leave Request (3 Days: Mon-Wed Sep 7-9, 2026)
    const leaveReqRes = await request(
      { hostname: "localhost", port: 5000, path: "/api/time-off-requests", method: "POST", headers: { "Content-Type": "application/json", Cookie: empSession.cookie } },
      {
        employee: newEmpId,
        timeOffType: timeOffTypeId,
        startDate: "2026-09-07",
        endDate: "2026-09-09",
        reason: "Annual conference research presentation",
      }
    );
    assert(leaveReqRes.statusCode === 201, "Employee submitted Leave Request for 3 work days (201)");
    const leaveReq = leaveReqRes.body?.data?.request || leaveReqRes.body?.request;
    const leaveReqId = leaveReq?._id;
    assert(leaveReq?.duration === 3, `Working schedule duration auto-calculated 3 days (actual: ${leaveReq?.duration})`);

    // 2F. HR Approves Request & Quota Decrement
    const approveLeaveRes = await request({
      hostname: "localhost",
      port: 5000,
      path: `/api/time-off-requests/${leaveReqId}/approve`,
      method: "PUT",
      headers: { Cookie: hrManager.cookie },
    });
    assert(approveLeaveRes.statusCode === 200, "HR Manager approved leave request (200)");

    // Verify Allocation balance deduction
    const checkAllocRes = await request({
      hostname: "localhost",
      port: 5000,
      path: `/api/time-off-allocations/${allocId}`,
      method: "GET",
      headers: { Cookie: admin.cookie },
    });
    const updatedAlloc = checkAllocRes.body?.data?.allocation || checkAllocRes.body?.allocation;
    assert(updatedAlloc?.takenAmount === 3, `Allocation takenAmount updated to 3 days (actual: ${updatedAlloc?.takenAmount})`);
    assert(updatedAlloc?.allocatedAmount - updatedAlloc?.takenAmount === 12, "Remaining balance accurately reflects 12 days remaining");

    // 2G. Submit Excess Request Exceeding Balance (20 Days) -> HTTP 409 Conflict
    const excessReqRes = await request(
      { hostname: "localhost", port: 5000, path: "/api/time-off-requests", method: "POST", headers: { "Content-Type": "application/json", Cookie: empSession.cookie } },
      {
        employee: newEmpId,
        timeOffType: timeOffTypeId,
        startDate: "2026-10-01",
        endDate: "2026-10-28", // 20 working days
        reason: "Extended holiday trip",
      }
    );
    assert(excessReqRes.statusCode === 201, "Submitted request requiring more quota than available");
    const excessReqId = excessReqRes.body?.data?.request?._id || excessReqRes.body?.request?._id;

    // HR Attempts to Approve Excess Request -> Should Fail with HTTP 409 Conflict
    const appExcessRes = await request({
      hostname: "localhost",
      port: 5000,
      path: `/api/time-off-requests/${excessReqId}/approve`,
      method: "PUT",
      headers: { Cookie: hrManager.cookie },
    });
    assert(appExcessRes.statusCode === 409, `Approval of excessive leave properly rejected with HTTP 409 Conflict (Status: ${appExcessRes.statusCode})`);

    // =========================================================================
    // 4. CANONICAL RBAC MATRIX VALIDATION
    // =========================================================================
    console.log("\n================================================================================");
    console.log("4. Canonical 5-Role RBAC Matrix Enforcement");
    console.log("================================================================================");

    // Admin-Only Routes
    const adminCheckUsers = await request({ hostname: "localhost", port: 5000, path: "/api/users", method: "GET", headers: { Cookie: admin.cookie } });
    assert(adminCheckUsers.statusCode === 200, "Admin permitted on /api/users (200)");

    const hrCheckUsers = await request({ hostname: "localhost", port: 5000, path: "/api/users", method: "GET", headers: { Cookie: hrManager.cookie } });
    assert(hrCheckUsers.statusCode === 403, "HR Manager blocked from /api/users (403 Forbidden)");

    const empCheckUsers = await request({ hostname: "localhost", port: 5000, path: "/api/users", method: "GET", headers: { Cookie: employee.cookie } });
    assert(empCheckUsers.statusCode === 403, "Employee blocked from /api/users (403 Forbidden)");

    // Payroll-Only Routes
    const payMgrCheckRules = await request({ hostname: "localhost", port: 5000, path: "/api/salary-rules", method: "GET", headers: { Cookie: hrPayrollManager.cookie } });
    assert(payMgrCheckRules.statusCode === 200, "HR Payroll Manager permitted on /api/salary-rules (200)");

    const hrMgrCheckRules = await request({ hostname: "localhost", port: 5000, path: "/api/salary-rules", method: "GET", headers: { Cookie: hrManager.cookie } });
    assert(hrMgrCheckRules.statusCode === 403, "HR Manager blocked from /api/salary-rules (403 Forbidden)");

    const empCheckRules = await request({ hostname: "localhost", port: 5000, path: "/api/salary-rules", method: "GET", headers: { Cookie: employee.cookie } });
    assert(empCheckRules.statusCode === 403, "Employee blocked from /api/salary-rules (403 Forbidden)");

    // Clean up created test resources
    console.log("\nCleaning up Phase 25 test records...");
    try {
      if (leaveReqId) await request({ hostname: "localhost", port: 5000, path: `/api/time-off-requests/${leaveReqId}`, method: "DELETE", headers: { Cookie: admin.cookie } });
      if (excessReqId) await request({ hostname: "localhost", port: 5000, path: `/api/time-off-requests/${excessReqId}`, method: "DELETE", headers: { Cookie: admin.cookie } });
      if (allocId) await request({ hostname: "localhost", port: 5000, path: `/api/time-off-allocations/${allocId}`, method: "DELETE", headers: { Cookie: admin.cookie } });
      if (timeOffTypeId) await request({ hostname: "localhost", port: 5000, path: `/api/time-off-types/${timeOffTypeId}`, method: "DELETE", headers: { Cookie: admin.cookie } });
      const createdUserId = createUserRes.body?.data?.user?._id || createUserRes.body?.user?._id;
      if (createdUserId) await request({ hostname: "localhost", port: 5000, path: `/api/users/${createdUserId}`, method: "DELETE", headers: { Cookie: admin.cookie } });
      if (newEmpId) await request({ hostname: "localhost", port: 5000, path: `/api/employees/${newEmpId}`, method: "DELETE", headers: { Cookie: admin.cookie } });
      console.log("✓ Phase 25 test records cleaned up successfully");
    } catch (cleanupErr) {
      console.warn("Cleanup warning:", cleanupErr.message);
    }

    console.log("\n================================================================================");
    console.log(`   PHASE 25 E2E VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("================================================================================\n");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error("Fatal error during Phase 25 E2E test execution:", err);
    process.exit(1);
  }
}

runPhase25E2ESuite();
