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
// Initialize Redis client (prefer REDIS_URL; fallback to host/port)
const redisOptions = process.env.REDIS_URL
  ? { url: process.env.REDIS_URL }
  : {
      username: "default",
      password: process.env.REDIS_PASSWORD,
      socket: {
        host: process.env.REDIS_HOST || "127.0.0.1",
        port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
      },
    };

const redisClient = createClient(redisOptions);

redisClient.on("error", (err) => {
  console.error("[Redis] Connection Error:", err.message);
});

redisClient.on("connect", () => {
  console.log("[Redis] Connected (socket established)");
});

// Try connecting with retries and exponential backoff
async function connectRedisWithRetry(client, maxAttempts = 5) {
  let attempt = 0;
  while (attempt < maxAttempts) {
    try {
      await client.connect();
      console.log(
        "[Redis] Connected to",
        process.env.REDIS_URL ||
          `${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
      );
      return;
    } catch (err) {
      attempt += 1;
      const delay = Math.min(1000 * 2 ** attempt, 30000);
      console.error(`[Redis] Connect attempt ${attempt} failed:`, err.message);
      if (attempt >= maxAttempts) {
        console.error("[Redis] Max connect attempts reached. Exiting.");
        process.exit(1);
      }
      console.log(`[Redis] Retrying in ${delay}ms...`);
      // eslint-disable-next-line no-await-in-loop
      await new Promise((res) => setTimeout(res, delay));
    }
  }
}

await connectRedisWithRetry(redisClient);

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

//a general error handler for other cases such as incorrect JSON in the req body
app.use((err, _, res) => {
  res.status(500).send({ success: false, message: err.message });
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
