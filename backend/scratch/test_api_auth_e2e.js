const http = require("http");
const mongoose = require("mongoose");
const User = require("../src/models/User");
const Employee = require("../src/models/Employee");

async function request(options, body = null, cookie = null) {
  return new Promise((resolve, reject) => {
    const reqOptions = {
      hostname: "localhost",
      port: 5000,
      path: options.path,
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
      },
    };

    const req = http.request(reqOptions, (res) => {
      let data = "";
      const setCookieHeader = res.headers["set-cookie"];
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: parsed,
          cookie: setCookieHeader ? setCookieHeader.map(c => c.split(';')[0]).join('; ') : null,
        });
      });
    });

    req.on("error", reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runE2E() {
  console.log("\n==================================================");
  console.log("STARTING HTTP API E2E AUTHENTICATION TEST");
  console.log("==================================================");

  // 1. Log in as Admin
  const adminLogin = await request({ path: "/api/auth/login", method: "POST" }, {
    email: "admin@peoplepay360.local",
    password: "AdminPassword2026!",
  });

  if (adminLogin.status !== 200 || !adminLogin.cookie) {
    throw new Error(`Admin login failed: ${JSON.stringify(adminLogin.data)}`);
  }
  const adminCookie = adminLogin.cookie;
  console.log("✓ Admin logged in successfully via POST /api/auth/login");

  const timestamp = Date.now();
  const testEmail = `e2e_manual_${timestamp}@company.com`;
  const initialPassword = "InitialSecurePass2026!";
  const updatedPassword = "UpdatedSecurePass2026#";

  // 2. Admin creates manual employee with password
  console.log(`\n1. Admin creates manual employee (POST /api/employees)...`);
  const createEmpRes = await request({ path: "/api/employees", method: "POST" }, {
    fullName: "E2E Test Employee",
    email: testEmail,
    password: initialPassword,
    phone: "555-0199",
    employeeType: "Full-Time",
    status: "Active",
  }, adminCookie);

  if (createEmpRes.status !== 201) {
    throw new Error(`Create employee failed: ${JSON.stringify(createEmpRes.data)}`);
  }
  const createdEmp = createEmpRes.data.data.employee;
  console.log(`✓ Employee created: ${createdEmp.fullName} (${createdEmp.employeeCode}), ID: ${createdEmp._id}`);

  // 3. New employee logs in with email + initial password
  console.log(`\n2. New Employee logs in with email & initial password (POST /api/auth/login)...`);
  const empLogin1 = await request({ path: "/api/auth/login", method: "POST" }, {
    email: testEmail,
    password: initialPassword,
  });

  if (empLogin1.status !== 200 || !empLogin1.cookie) {
    throw new Error(`Employee login with initial password failed: ${JSON.stringify(empLogin1.data)}`);
  }
  console.log("✓ Employee successfully logged in with initial password!");

  // 4. Verify employee can fetch own profile via GET /api/employees/me
  const empMeRes = await request({ path: "/api/employees/me", method: "GET" }, null, empLogin1.cookie);
  if (empMeRes.status !== 200) {
    throw new Error(`GET /api/employees/me failed: ${JSON.stringify(empMeRes.data)}`);
  }
  console.log(`✓ GET /api/employees/me returned: ${empMeRes.data.data.employee.fullName}`);

  // 5. Admin updates employee password via PUT /api/employees/:id/password
  console.log(`\n3. Admin updates employee password (PUT /api/employees/${createdEmp._id}/password)...`);
  const updatePassRes = await request({ path: `/api/employees/${createdEmp._id}/password`, method: "PUT" }, {
    newPassword: updatedPassword,
  }, adminCookie);

  if (updatePassRes.status !== 200) {
    throw new Error(`Update employee password failed: ${JSON.stringify(updatePassRes.data)}`);
  }
  console.log("✓ Admin successfully updated employee password");

  // 6. Verify OLD password no longer works
  console.log(`\n4. Verifying OLD password is now rejected...`);
  const oldPassLogin = await request({ path: "/api/auth/login", method: "POST" }, {
    email: testEmail,
    password: initialPassword,
  });
  if (oldPassLogin.status === 200) {
    throw new Error("Old password still allowed login!");
  }
  console.log(`✓ Old password rejected as expected (status ${oldPassLogin.status})`);

  // 7. Verify NEW password works for employee login
  console.log(`\n5. Verifying NEW password authenticates successfully...`);
  const newPassLogin = await request({ path: "/api/auth/login", method: "POST" }, {
    email: testEmail,
    password: updatedPassword,
  });
  if (newPassLogin.status !== 200) {
    throw new Error(`New password failed to log in: ${JSON.stringify(newPassLogin.data)}`);
  }
  console.log("✓ Employee logged in successfully with NEW password!");

  // 8. Cleanup test data
  await mongoose.connect("mongodb://127.0.0.1:27017/peoplepay360_db");
  await Employee.deleteMany({ email: testEmail });
  await User.deleteMany({ email: testEmail });
  await mongoose.disconnect();
  console.log("✓ Cleaned up test records from database");

  console.log("\n==================================================");
  console.log("HTTP API E2E AUTHENTICATION TEST PASSED 100% ✓");
  console.log("==================================================");
}

runE2E().catch((err) => {
  console.error("❌ E2E Test Failed:", err);
  process.exit(1);
});
