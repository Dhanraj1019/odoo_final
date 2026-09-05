const session = require("express-session");
const MongoStore = require("connect-mongo").default;

const mongoUri =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  "mongodb://127.0.0.1:27017/peoplepay360_db";

const secret =
  process.env.SESSION_SECRET || "odoo_super_secret_session_key_2026";

const sessionStore = MongoStore.create({
  mongoUrl: mongoUri,
  crypto: {
    secret: secret,
  },
  touchAfter: 24 * 3600, // lazy session update (24 hours)
});

sessionStore.on("error", (err) => {
  console.error("[Session Store] Error:", err);
});

const sessionMiddleware = session({
  store: sessionStore,
  secret: secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge:
      parseInt(process.env.SESSION_COOKIE_MAX_AGE, 10) ||
      24 * 60 * 60 * 1000, // default 24h
  },
});

module.exports = sessionMiddleware;
