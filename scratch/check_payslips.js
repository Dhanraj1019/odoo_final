const mongoose = require("mongoose");
require("dotenv").config();

async function main() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/peoplepay360_db");
  const Payslip = require("./src/models/Payslip");
  const count = await Payslip.countDocuments();
  console.log("Total payslips in DB:", count);
  const statusCounts = await Payslip.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 }, totalNet: { $sum: "$netSalary" } } }
  ]);
  console.log("Payslips by status:", JSON.stringify(statusCounts, null, 2));

  const monthCounts = await Payslip.aggregate([
    { $group: { _id: { status: "$status", month: { $dateToString: { format: "%Y-%m", date: "$periodStart" } } }, count: { $sum: 1 }, totalNet: { $sum: "$netSalary" } } },
    { $sort: { "_id.month": 1 } }
  ]);
  console.log("Payslips by month & status:", JSON.stringify(monthCounts, null, 2));
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
