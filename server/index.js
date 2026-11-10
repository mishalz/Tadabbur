import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pool, { checkDatabase } from "./db/pool.js";
import { ensureSchema } from "./db/schema.js";

const PORT = process.env.PORT || 8000;
const NODE_ENV = process.env.NODE_ENV || "development";

import cors from "cors";

//retrieving routes from specific components
import authRoutes from "./components/auth/auth.routes.js";
import contentRoutes from "./components/content/content.routes.js";
import quranRoutes from "./components/quran-retrieval/quran.routes.js";

//starting the express app
const app = express();

// ─────────────────────────────────────────────────────────────────
// CORS Configuration
// ─────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.APP_BASE_URL,
    credentials: true,
  }),
);

// ─────────────────────────────────────────────────────────────────
// Body Parser Middleware
// ─────────────────────────────────────────────────────────────────
app.use(bodyParser.json());

// ─────────────────────────────────────────────────────────────────
// Database (Postgres) – app data and sessions
// ─────────────────────────────────────────────────────────────────
// Create tables in the background; a failure (e.g. a suspended free-tier
// database still waking up) is logged and retried on the next query, never fatal.
ensureSchema()
  .then(() => console.log("[DB] Schema ready"))
  .catch((err) => console.error("[DB] Schema setup failed:", err.message));

// Lightweight keep-alive for uptime monitors. Does not touch the database or
// session store, so frequent pings keep the Render service awake without
// waking a suspended free-tier database.
app.get("/ping", (_, res) => {
  res.status(200).send("ok");
});

// Deep health check: also verifies the database is reachable.
// Not for frequent polling, as each call wakes an auto-suspended database.
app.get("/healthz", async (_, res) => {
  try {
    await checkDatabase();
    res.status(200).json({ status: "ok", database: "up" });
  } catch (err) {
    console.error("[DB] Health check failed:", err.message);
    res.status(503).json({ status: "degraded", database: "down" });
  }
});

// Session configuration
function resolveSameSite() {
  const override = (process.env.COOKIE_SAMESITE || "").toLowerCase();
  if (["lax", "strict", "none"].includes(override)) return override;
  return NODE_ENV === "production" ? "none" : "lax";
}
const sessionConfig = {
  secret: process.env.SESSION_SECRET_KEY,
  resave: false,
  saveUninitialized: false,
  name: "tadabbur-session", // Custom session cookie name
  rolling: true, // Refresh session TTL on activity
  cookie: {
    httpOnly: true, // Prevent client-side JS from accessing the cookie
    secure: NODE_ENV === "production", // HTTPS only in production
    // In production we need SameSite=None for cross-site requests (and secure=true).
    // For local development allow 'lax' to avoid the browser rejecting the cookie
    // when Secure is not set on localhost.
    // Set COOKIE_SAMESITE=lax when the API is served same-site (e.g. proxied
    // through the frontend host); "none" is only needed for direct cross-site calls.
    sameSite: resolveSameSite(),
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  },
};

// Configure session store (Postgres; the "session" table is created if missing)
const PgSessionStore = connectPgSimple(session);
sessionConfig.store = new PgSessionStore({
  pool,
  tableName: "session",
  createTableIfMissing: true,
  pruneSessionInterval: 60 * 60, // delete expired sessions hourly
});

// If behind a proxy (like Render, Railway, Vercel), trust the proxy
if (NODE_ENV === "production") {
  app.set("trust proxy", 1);
  console.log("[Server] Trust proxy enabled for production");
}

app.use(session(sessionConfig));

//forwarding all routes to their specific component
app.use("/api/auth", authRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/quran", quranRoutes);

// Fallback route (Handles 404 errors)
app.use((_, res) => {
  res.status(404).send({
    success: false,
    message: "Sorry, this page does not exist",
  });
});

// General error handler. Express only treats a function as an error handler
// when it takes exactly four arguments (err, req, res, next).
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("[Server] Unhandled error:", err.message);
  const status = err.status || err.statusCode || 500;
  res.status(status).send({
    success: false,
    message:
      status === 400 ? "Invalid request body" : "Internal server error",
  });
});

//starting the server
app.listen(PORT, () => {
  console.log(`Server is starting on port ${PORT}`);
  try {
    console.log("The server is up and running!");
  } catch (err) {
    console.log("Error in server startup:", err);
  }
});

export default app;
