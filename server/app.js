import express from "express";
import cors from "cors";
import helmet from "helmet";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";

import config from "./config.js";
import pool, { checkDatabase } from "./db/pool.js";
import authRoutes from "./components/auth/auth.routes.js";
import contentRoutes from "./components/content/content.routes.js";
import quranRoutes from "./components/quran-retrieval/quran.routes.js";
import { apiLimiter, authLimiter } from "./middleware/rateLimiters.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandlers.js";

/**
 * Builds the Express app. It never calls listen(), so tests can import it
 * directly; index.js is the process entry point that starts the server.
 */
const app = express();

app.disable("x-powered-by");
// Behind a reverse proxy (Render): needed for secure cookies and correct client IPs.
if (config.isProduction) app.set("trust proxy", config.trustProxyHops);

app.use(helmet());
app.use(cors({ origin: config.appBaseUrl, credentials: true }));
app.use(express.json({ limit: "100kb" }));

// ─────────────────────────────────────────────────────────────────
// Health endpoints (before the session middleware: no session needed)
// ─────────────────────────────────────────────────────────────────
// Lightweight keep-alive for uptime monitors. Touches neither the database
// nor the session store, so frequent pings keep the service awake without
// waking a suspended free-tier database.
app.get("/ping", (_req, res) => {
  res.status(200).send("ok");
});

// Deep health check: also verifies the database is reachable.
// Not for frequent polling, as each call wakes an auto-suspended database.
app.get("/healthz", async (_req, res) => {
  try {
    await checkDatabase();
    res.status(200).json({ status: "ok", database: "up" });
  } catch (err) {
    console.error("[DB] Health check failed:", err.message);
    res.status(503).json({ status: "degraded", database: "down" });
  }
});

// ─────────────────────────────────────────────────────────────────
// Sessions (Postgres-backed)
// ─────────────────────────────────────────────────────────────────
const PgSessionStore = connectPgSimple(session);

app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    name: config.cookie.name,
    rolling: true, // refresh the expiry on activity
    store: new PgSessionStore({
      pool,
      tableName: "session",
      createTableIfMissing: true,
      pruneSessionInterval: 60 * 60, // delete expired sessions hourly
    }),
    cookie: {
      httpOnly: true, // not readable from client-side JS
      secure: config.cookie.secure,
      sameSite: config.cookie.sameSite,
      maxAge: config.cookie.maxAgeMs,
    },
  }),
);

// ─────────────────────────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────────────────────────
app.use("/api", apiLimiter);
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/quran", quranRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
