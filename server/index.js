import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import session from "express-session";
import { RedisStore } from "connect-redis";
import { createClient } from "redis";

const PORT = process.env.PORT || 8000;
const NODE_ENV = process.env.NODE_ENV || "development";
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

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
// Session Middleware with Redis Store
// ─────────────────────────────────────────────────────────────────
// Initialize Redis client (prefer REDIS_URL; fallback to host/port).
// reconnectStrategy retries forever with capped exponential backoff, so a slow
// or sleeping Redis instance never takes the whole API down.
// disableOfflineQueue makes commands fail fast while disconnected instead of
// hanging requests until the client reconnects.
const reconnectStrategy = (retries) => Math.min(500 * 2 ** retries, 15000);

const redisOptions = process.env.REDIS_URL
  ? {
      url: process.env.REDIS_URL,
      socket: { reconnectStrategy },
      disableOfflineQueue: true,
    }
  : {
      username: "default",
      password: process.env.REDIS_PASSWORD,
      socket: {
        host: process.env.REDIS_HOST || "127.0.0.1",
        port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
        reconnectStrategy,
      },
      disableOfflineQueue: true,
    };

const redisClient = createClient(redisOptions);

redisClient.on("error", (err) => {
  console.error("[Redis] Error:", err.message);
});
redisClient.on("ready", () => console.log("[Redis] Ready"));
redisClient.on("reconnecting", () => console.log("[Redis] Reconnecting..."));

// Connect in the background: the server starts listening immediately and
// sessions start working as soon as Redis is ready. A failure is logged,
// never fatal.
redisClient
  .connect()
  .catch((err) => console.error("[Redis] Initial connect failed:", err.message));

// Health check (used by Render / uptime monitors). Does not require a session.
app.get("/healthz", (_, res) => {
  const redisReady = redisClient.isReady;
  res.status(redisReady ? 200 : 503).json({
    status: redisReady ? "ok" : "degraded",
    redis: redisReady ? "up" : "down",
  });
});

// Session configuration
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
    sameSite: NODE_ENV === "production" ? "none" : "lax",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  },
};

// Configure session store (set TTL to match cookie.maxAge)
const sessionStore = new RedisStore({
  client: redisClient,
  prefix: "Tadabbur-session:",
  ttl: Math.floor(sessionConfig.cookie.maxAge / 1000),
});

sessionConfig.store = sessionStore;

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
