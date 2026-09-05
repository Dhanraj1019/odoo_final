require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const passport = require("passport");
const methodOverride = require("method-override");
const LocalStrategy = require("passport-local");
const mongoose = require("mongoose");

const connectDB = require("./config/db");
require("./config/passport"); // Passport strategies and serialize/deserialize setup
const authRouter = require("./routers/authRouter");

const app = express();
const port = process.env.PORT || 5000;
const mongoUrl = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/odoo_db";

// Connect to MongoDB
connectDB();

// CORS configuration (allow credentials for session cookies)
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Method override middleware
app.use(methodOverride("_method"));

// MongoDB Session Store
const store = MongoStore.create({
  mongoUrl: mongoUrl,
  crypto: {
    secret: process.env.SESSION_SECRET || "odoo_super_secret_session_key_2026",
  },
  touchAfter: 24 * 3600, // lazy session update interval (24 hours)
});

store.on("error", (err) => {
  console.error("[Session Store] Error:", err);
});

// Express Session configuration with MongoDB store
app.use(
  session({
    store: store,
    secret: process.env.SESSION_SECRET || "odoo_super_secret_session_key_2026",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Health route
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Authentication Routes
app.use("/api/auth", authRouter);

// Start server
app.listen(port, () => {
  console.log(`[Server] Express is listening on port ${port}`);
});