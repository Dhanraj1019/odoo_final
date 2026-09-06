const mongoose = require("mongoose");
require("dotenv").config();

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/peoplepay360";

async function cleanup() {
  console.log("Connecting to database:", uri);
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  // 1. Identify test TimeOffTypes
  const testTypeRegex = /^(AutoType|P20 Vacation|Paid Earned Leave \d+|Vacation Leave \d+|temp)/i;
  
  const dummyTypes = await db.collection("timeofftypes").find({ name: { $regex: testTypeRegex } }).toArray();
  console.log(`Found ${dummyTypes.length} dummy/test TimeOffTypes:`);
  dummyTypes.forEach((t) => console.log(` - [${t._id}] ${t.name}`));

  const dummyTypeIds = dummyTypes.map((t) => t._id);

  if (dummyTypeIds.length > 0) {
    // Check and delete dependent requests
    const deletedRequests = await db.collection("timeoffrequests").deleteMany({ timeOffType: { $in: dummyTypeIds } });
    console.log(`✓ Deleted ${deletedRequests.deletedCount} dependent TimeOffRequests`);

    // Check and delete dependent allocations
    const deletedAllocations = await db.collection("timeoffallocations").deleteMany({ timeOffType: { $in: dummyTypeIds } });
    console.log(`✓ Deleted ${deletedAllocations.deletedCount} dependent TimeOffAllocations`);

    // Delete dummy types
    const deletedTypes = await db.collection("timeofftypes").deleteMany({ _id: { $in: dummyTypeIds } });
    console.log(`✓ Deleted ${deletedTypes.deletedCount} dummy TimeOffTypes`);
  }

  // 2. Identify test employees created by automated test scripts
  const testEmpRegex = /(emp_audit|test\.employee|audit\.emp|e2e_staff|standalone_1788)/i;
  const dummyEmps = await db.collection("employees").find({
    $or: [
      { email: { $regex: testEmpRegex } },
      { fullName: { $regex: /Dr\. Alan Turing \d+/i } }
    ]
  }).toArray();
  console.log(`\nFound ${dummyEmps.length} dummy/test Employees:`);
  dummyEmps.forEach((e) => console.log(` - [${e._id}] ${e.fullName} (${e.email})`));

  const dummyEmpIds = dummyEmps.map((e) => e._id);
  if (dummyEmpIds.length > 0) {
    const delReqs = await db.collection("timeoffrequests").deleteMany({ employee: { $in: dummyEmpIds } });
    const delAllocs = await db.collection("timeoffallocations").deleteMany({ employee: { $in: dummyEmpIds } });
    const delUsers = await db.collection("users").deleteMany({ employee: { $in: dummyEmpIds } });
    const delEmps = await db.collection("employees").deleteMany({ _id: { $in: dummyEmpIds } });
    console.log(`✓ Cleaned up ${delEmps.deletedCount} test employees, ${delUsers.deletedCount} users, ${delAllocs.deletedCount} allocations, and ${delReqs.deletedCount} requests.`);
  }

  // 3. Ensure canonical standard leave types exist
  const canonical = [
    { name: "Paid Time Off", unit: "Days", requiresAllocation: true, requiresApproval: true, affectsPayroll: true, isPaid: true, status: "Active" },
    { name: "Sick Leave", unit: "Days", requiresAllocation: true, requiresApproval: true, affectsPayroll: true, isPaid: true, status: "Active" },
    { name: "Unpaid Leave", unit: "Days", requiresAllocation: false, requiresApproval: true, affectsPayroll: true, isPaid: false, status: "Active" },
  ];

  for (const item of canonical) {
    const exists = await db.collection("timeofftypes").findOne({ name: item.name });
    if (!exists) {
      await db.collection("timeofftypes").insertOne({ ...item, createdAt: new Date(), updatedAt: new Date() });
      console.log(`✓ Created canonical TimeOffType: ${item.name}`);
    }
  }

  const remainingTypes = await db.collection("timeofftypes").find().toArray();
  console.log("\n=======================================================");
  console.log("   CLEANUP COMPLETE: Canonical TimeOffTypes in Database");
  console.log("=======================================================");
  remainingTypes.forEach((t) => console.log(` - ${t.name} (Unit: ${t.unit}, Status: ${t.status}, RequiresAllocation: ${t.requiresAllocation})`));

  process.exit(0);
}

cleanup().catch((err) => {
  console.error("Cleanup error:", err);
  process.exit(1);
});
