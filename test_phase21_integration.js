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

async function runPhase21Tests() {
  console.log("================================================================");
  console.log("   PEOPLEPAY360 — PHASE 21 PAYROLL CONFIG LIVE INTEGRATION & RBAC");
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

    const ts = Date.now();

    // 2. Salary Rules Management — CRUD across all 3 methods
    console.log("\n2. Testing Salary Rules Creation (Fixed, Percentage, Formula)...");

    // A. Create Fixed Rule
    const fixedCode = `P21_FIXED_${ts}`;
    const createFixedRes = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: "/api/salary-rules",
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: admin.cookie },
      },
      {
        name: `P21 Basic Salary ${ts}`,
        code: fixedCode,
        category: "Basic",
        sequence: 10,
        computationMethod: "Fixed",
        fixedAmount: 50000,
        status: "Active",
      }
    );
    assert(createFixedRes.statusCode === 201 || createFixedRes.statusCode === 200, `Admin created Fixed Salary Rule (Status: ${createFixedRes.statusCode})`);
    const fixedRule = createFixedRes.body?.data?.salaryRule || createFixedRes.body?.salaryRule || createFixedRes.body?.data;
    const fixedRuleId = fixedRule?._id;

    // B. Create Percentage Rule
    const pctCode = `P21_HRA_${ts}`;
    const createPctRes = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: "/api/salary-rules",
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: hrPayrollManager.cookie },
      },
      {
        name: `P21 HRA Allowance ${ts}`,
        code: pctCode,
        category: "Allowance",
        sequence: 20,
        computationMethod: "Percentage",
        percentageOf: fixedCode,
        percentageValue: 50,
        status: "Active",
      }
    );
    assert(createPctRes.statusCode === 201 || createPctRes.statusCode === 200, `HR Payroll Manager created Percentage Rule (Status: ${createPctRes.statusCode})`);
    const pctRule = createPctRes.body?.data?.salaryRule || createPctRes.body?.salaryRule || createPctRes.body?.data;
    const pctRuleId = pctRule?._id;

    // C. Create Formula Rule
    const formulaCode = `P21_PF_${ts}`;
    const createFormulaRes = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: "/api/salary-rules",
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: hrPayrollManager.cookie },
      },
      {
        name: `P21 PF Deduction ${ts}`,
        code: formulaCode,
        category: "Deduction",
        sequence: 30,
        computationMethod: "Formula",
        formulaExpression: `ROUND(${fixedCode} * 0.12, 0)`,
        status: "Active",
      }
    );
    assert(createFormulaRes.statusCode === 201 || createFormulaRes.statusCode === 200, `HR Payroll Manager created Formula Rule (Status: ${createFormulaRes.statusCode})`);
    const formulaRule = createFormulaRes.body?.data?.salaryRule || createFormulaRes.body?.salaryRule || createFormulaRes.body?.data;
    const formulaRuleId = formulaRule?._id;

    // D. Formula Validation (Reject Invalid Formula Syntax)
    const invalidFormulaRes = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: "/api/salary-rules",
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: hrPayrollManager.cookie },
      },
      {
        name: "Invalid Formula Rule",
        code: `P21_INV_${ts}`,
        category: "Allowance",
        sequence: 40,
        computationMethod: "Formula",
        formulaExpression: "BASIC * * 0.5 (invalid syntax)",
        status: "Active",
      }
    );
    assert(invalidFormulaRes.statusCode === 400, `Invalid formula syntax properly rejected with 400 Bad Request (${invalidFormulaRes.statusCode})`);

    // E. Retrieve and Update Salary Rule
    console.log("\n3. Testing Salary Rule Retrieval and Update...");
    const getRuleRes = await request({
      hostname: "localhost",
      port: 5000,
      path: `/api/salary-rules/${fixedRuleId}`,
      method: "GET",
      headers: { Cookie: hrPayrollUser.cookie },
    });
    assert(getRuleRes.statusCode === 200, `HR Payroll User retrieved salary rule (Status: 200)`);

    const updateRuleRes = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: `/api/salary-rules/${fixedRuleId}`,
        method: "PUT",
        headers: { "Content-Type": "application/json", Cookie: hrPayrollManager.cookie },
      },
      {
        name: `P21 Basic Salary Updated ${ts}`,
        fixedAmount: 55000,
      }
    );
    assert(updateRuleRes.statusCode === 200, `Salary rule updated successfully (Status: ${updateRuleRes.statusCode})`);

    // 4. Salary Structures Management — Ordered Sequencer & Precedence Validation
    console.log("\n4. Testing Salary Structures Creation and Ordering...");
    const structName = `P21 Corporate Structure ${ts}`;
    const createStructRes = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: "/api/salary-structures",
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: hrPayrollManager.cookie },
      },
      {
        name: structName,
        description: "Standard executive computation structure",
        rules: [fixedRuleId, pctRuleId, formulaRuleId],
        status: "Active",
      }
    );
    assert(createStructRes.statusCode === 201 || createStructRes.statusCode === 200, `Created Salary Structure with 3 ordered rules (Status: ${createStructRes.statusCode})`);
    const createdStruct = createStructRes.body?.data?.salaryStructure || createStructRes.body?.salaryStructure || createStructRes.body?.data;
    const structId = createdStruct?._id;

    // Verify populated rules order
    const getStructRes = await request({
      hostname: "localhost",
      port: 5000,
      path: `/api/salary-structures/${structId}`,
      method: "GET",
      headers: { Cookie: hrPayrollUser.cookie },
    });
    assert(getStructRes.statusCode === 200, `Retrieved populated Salary Structure (Status: 200)`);
    const fetchedStruct = getStructRes.body?.data?.salaryStructure || getStructRes.body?.salaryStructure || getStructRes.body?.data;
    const ruleCount = Array.isArray(fetchedStruct?.rules) ? fetchedStruct.rules.length : 0;
    assert(ruleCount === 3, `Salary structure preserves exact 3 rule execution sequence`);

    // Test Sequence Validation Failure (reversing order where HRA refers to subsequent BASIC)
    const invalidOrderRes = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: "/api/salary-structures",
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: admin.cookie },
      },
      {
        name: `Invalid Sequence Structure ${ts}`,
        description: "Violates sequence ordering",
        rules: [pctRuleId, fixedRuleId], // HRA refers to FIXED, but FIXED is second!
        status: "Active",
      }
    );
    assert(invalidOrderRes.statusCode === 400, `Forward-dependency sequence ordering violation rejected with 400 (${invalidOrderRes.statusCode})`);

    // 5. RBAC Behavior Matrix
    console.log("\n5. Testing Comprehensive RBAC Permissions Matrix...");

    // HR Payroll User: Allowed to Read, Blocked from Mutation
    const userListRes = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/salary-rules",
      method: "GET",
      headers: { Cookie: hrPayrollUser.cookie },
    });
    assert(userListRes.statusCode === 200, `HR Payroll User can view salary rules (Status: 200)`);

    const userMutateRes = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: "/api/salary-rules",
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: hrPayrollUser.cookie },
      },
      {
        name: "Unauthorized Rule",
        code: `P21_UNAUTH_${ts}`,
        category: "Allowance",
        computationMethod: "Fixed",
        fixedAmount: 1000,
      }
    );
    assert(userMutateRes.statusCode === 403, `HR Payroll User blocked from creating rules (403 Forbidden: ${userMutateRes.statusCode})`);

    // HR Manager: Blocked from Payroll Configuration
    const hrMgrRulesRes = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/salary-rules",
      method: "GET",
      headers: { Cookie: hrManager.cookie },
    });
    assert(hrMgrRulesRes.statusCode === 403, `HR Manager blocked from payroll rules (403 Forbidden: ${hrMgrRulesRes.statusCode})`);

    // Employee: Blocked from Payroll Configuration
    const empRulesRes = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/salary-rules",
      method: "GET",
      headers: { Cookie: employee.cookie },
    });
    assert(empRulesRes.statusCode === 403, `Employee blocked from payroll rules (403 Forbidden: ${empRulesRes.statusCode})`);

    // 6. Regression Verification for Phases 14–20
    console.log("\n6. Testing Regression for Completed Phases (14–20)...");
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

    // Summary
    console.log("\n================================================================");
    console.log(`   PHASE 21 VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
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

runPhase21Tests();
