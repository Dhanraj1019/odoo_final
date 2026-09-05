const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const connUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/odoo_db";
    const conn = await mongoose.connect(connUri);
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
