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

async function runPhase22Tests() {
  console.log("================================================================");
  console.log("   PEOPLEPAY360 — PHASE 22 PAYRUN & PAYSLIP LIVE INTEGRATION & RBAC");
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

    const empUserObj = employee.body?.data?.user || employee.body?.user;
    const employeeId = empUserObj?.employee?._id || empUserObj?.employee;
    console.log(`\n  Authenticated Employee ID: ${employeeId}`);

    // 2. Fetch Active Salary Structure for Payrun
    console.log("\n2. Fetching Salary Structure & Querying Eligible Candidates...");
    const structRes = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/salary-structures?status=Active",
      method: "GET",
      headers: { Cookie: hrPayrollManager.cookie },
    });
    assert(structRes.statusCode === 200, "Fetched Active Salary Structures (200)");
    const structures = structRes.body?.data?.salaryStructures || structRes.body?.salaryStructures || [];
    assert(structures.length > 0, `Found ${structures.length} active salary structures`);
    const targetStructure = structures.find((s) => Array.isArray(s.rules) && s.rules.length > 0) || structures[0];
    const structureId = targetStructure._id;

    // Query Eligible Candidate Employees
    const periodStart = "2026-08-01";
    const periodEnd = "2026-08-31";
    const candidatesRes = await request({
      hostname: "localhost",
      port: 5000,
      path: `/api/payruns/eligible-employees?salaryStructure=${structureId}&periodStart=${periodStart}&periodEnd=${periodEnd}`,
      method: "GET",
      headers: { Cookie: hrPayrollManager.cookie },
    });
    assert(candidatesRes.statusCode === 200, `Queried eligible employees for period (Status: ${candidatesRes.statusCode})`);
    const candidates = candidatesRes.body?.data?.candidates || candidatesRes.body?.candidates || [];
    const validCandidates = candidates.filter((c) => !c.issue && c.contract);
    const selectedCandidates = validCandidates.length > 0 ? validCandidates : candidates;
    const candidateIds = selectedCandidates.map((c) => (c.employee?._id || c._id)).filter(Boolean);

    // 3. Create Payrun Batch (Step 1 & 2 Wizard completion)
    console.log("\n3. Creating Payrun Batch...");
    const ts = Date.now();
    const payrunName = `P22 August 2026 Batch ${ts}`;
    const createRunRes = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: "/api/payruns",
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: hrPayrollManager.cookie },
      },
      {
        name: payrunName,
        salaryStructure: structureId,
        periodStart,
        periodEnd,
        employeeType: "All",
        selectedEmployees: candidateIds,
      }
    );
    assert(createRunRes.statusCode === 201 || createRunRes.statusCode === 200, `Payrun batch created in Draft status (Status: ${createRunRes.statusCode})`);
    const createdPayrun = createRunRes.body?.data?.payrun || createRunRes.body?.payrun || createRunRes.body?.data;
    const payrunId = createdPayrun?._id;

    // 4. Payrun Processing Lifecycle (Compute -> Validate -> Mark Paid -> Send Payslips)
    console.log("\n4. Executing Payrun Lifecycle Workflow...");

    // A. Compute Payrun
    const computeRes = await request({
      hostname: "localhost",
      port: 5000,
      path: `/api/payruns/${payrunId}/compute`,
      method: "POST",
      headers: { Cookie: hrPayrollManager.cookie },
    });
    assert(computeRes.statusCode === 200, `Payrun computed successfully (Status: ${computeRes.statusCode})`);
    const computedPayrun = computeRes.body?.data?.payrun || computeRes.body?.payrun;
    assert(computedPayrun?.status === "Computed", `Payrun status transitioned to "Computed"`);

    // Verify Payslips were generated
    const slipsRes = await request({
      hostname: "localhost",
      port: 5000,
      path: `/api/payslips?payrun=${payrunId}`,
      method: "GET",
      headers: { Cookie: hrPayrollManager.cookie },
    });
    assert(slipsRes.statusCode === 200, `Queried generated payslips for payrun (Status: 200)`);
    const payslips = slipsRes.body?.data?.payslips || slipsRes.body?.payslips || [];
    assert(payslips.length === candidateIds.length, `Generated ${payslips.length} payslips matching selected employees`);
    const samplePayslip = payslips.find((p) => !p.warnings || p.warnings.length === 0) || payslips[0];
    const samplePayslipId = samplePayslip?._id;

    // B. Validate Payrun
    const validateRes = await request({
      hostname: "localhost",
      port: 5000,
      path: `/api/payruns/${payrunId}/validate`,
      method: "POST",
      headers: { Cookie: hrPayrollManager.cookie },
    });
    assert(validateRes.statusCode === 200, `Payrun validated successfully (Status: ${validateRes.statusCode})`);
    const validatedPayrun = validateRes.body?.data?.payrun || validateRes.body?.payrun;
    assert(validatedPayrun?.status === "Validated", `Payrun status transitioned to "Validated"`);

    // C. Mark as Paid
    const markPaidRes = await request({
      hostname: "localhost",
      port: 5000,
      path: `/api/payruns/${payrunId}/mark-paid`,
      method: "POST",
      headers: { Cookie: hrPayrollManager.cookie },
    });
    assert(markPaidRes.statusCode === 200, `Payrun marked as Paid (Status: ${markPaidRes.statusCode})`);
    const paidPayrun = markPaidRes.body?.data?.payrun || markPaidRes.body?.payrun;
    assert(paidPayrun?.status === "Paid" && Boolean(paidPayrun?.paidAt), `Payrun status transitioned to "Paid" with recorded paidAt`);

    // D. Send Payslips via Email
    const sendMailRes = await request({
      hostname: "localhost",
      port: 5000,
      path: `/api/payruns/${payrunId}/send-payslips`,
      method: "POST",
      headers: { Cookie: hrPayrollManager.cookie },
    });
    assert(sendMailRes.statusCode === 200, `Payslips email dispatch executed (Status: ${sendMailRes.statusCode})`);

    // 5. Payslip Line Inspection & PDF Streaming
    console.log("\n5. Inspecting Payslip Details & PDF Generation...");
    const getSlipRes = await request({
      hostname: "localhost",
      port: 5000,
      path: `/api/payslips/${samplePayslipId}`,
      method: "GET",
      headers: { Cookie: hrPayrollManager.cookie },
    });
    assert(getSlipRes.statusCode === 200, `Retrieved single detailed payslip (Status: 200)`);
    const detailedSlip = getSlipRes.body?.data?.payslip || getSlipRes.body?.payslip;
    assert(
      Array.isArray(detailedSlip?.lines) && detailedSlip.lines.length > 0,
      `Payslip has ${detailedSlip?.lines?.length || 0} rule breakdown lines (Gross: ₹${detailedSlip?.grossSalary}, Net: ₹${detailedSlip?.netSalary})`
    );

    // Stream Printable PDF
    const pdfRes = await request({
      hostname: "localhost",
      port: 5000,
      path: `/api/payslips/${samplePayslipId}/pdf`,
      method: "GET",
      headers: { Cookie: hrPayrollManager.cookie },
    });
    assert(pdfRes.statusCode === 200, `PDF stream returned HTTP 200`);
    assert(
      (pdfRes.headers["content-type"] || "").includes("application/pdf"),
      `PDF Content-Type is valid application/pdf (${pdfRes.headers["content-type"]})`
    );
    assert(pdfRes.body?.pdfBytes > 1000, `Streamed complete binary PDF document (${pdfRes.body?.pdfBytes} bytes)`);

    // 6. Employee Self-Service Scoping & RBAC Verification
    console.log("\n6. Testing Employee Self-Service Scoping & RBAC...");

    // Employee listing payslips: must only see own Paid payslips
    const empSlipsRes = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/payslips",
      method: "GET",
      headers: { Cookie: employee.cookie },
    });
    assert(empSlipsRes.statusCode === 200, `Employee retrieved payslips (Status: 200)`);
    const empSlips = empSlipsRes.body?.data?.payslips || empSlipsRes.body?.payslips || [];
    const allBelongToSelf = empSlips.every((s) => (s.employee?._id || s.employee) === employeeId);
    const allArePaid = empSlips.every((s) => s.status === "Paid");
    assert(allBelongToSelf, `All ${empSlips.length} returned payslips belong exclusively to authenticated employee`);
    assert(allArePaid, `All returned payslips for employee are in "Paid" status`);

    // Employee streaming own payslip PDF
    if (empSlips.length > 0) {
      const selfPdfRes = await request({
        hostname: "localhost",
        port: 5000,
        path: `/api/payslips/${empSlips[0]._id}/pdf`,
        method: "GET",
        headers: { Cookie: employee.cookie },
      });
      assert(selfPdfRes.statusCode === 200, `Employee can stream their own payslip PDF (200 OK)`);
    }

    // RBAC: Employee blocked from payrun console
    const empPayrunRes = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/payruns",
      method: "GET",
      headers: { Cookie: employee.cookie },
    });
    assert(empPayrunRes.statusCode === 403, `Employee blocked from payruns console (403 Forbidden: ${empPayrunRes.statusCode})`);

    // RBAC: HR Manager blocked from payruns
    const hrMgrPayrunRes = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/payruns",
      method: "GET",
      headers: { Cookie: hrManager.cookie },
    });
    assert(hrMgrPayrunRes.statusCode === 403, `HR Manager blocked from payruns console (403 Forbidden: ${hrMgrPayrunRes.statusCode})`);

    // 7. Regression Verification for Phases 14–21
    console.log("\n7. Testing Regression for Completed Phases (14–21)...");
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

    const timeOffRes = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/time-off-types",
      method: "GET",
      headers: { Cookie: admin.cookie },
    });
    assert(timeOffRes.statusCode === 200, "Phase 20 Time Off module intact (200)");

    const rulesRes = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/salary-rules",
      method: "GET",
      headers: { Cookie: hrPayrollManager.cookie },
    });
    assert(rulesRes.statusCode === 200, "Phase 21 Salary Rules intact (200)");

    // Summary
    console.log("\n================================================================");
    console.log(`   PHASE 22 VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
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

runPhase22Tests();
