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

// Initialize Redis client
const redisClient = createClient({
  username: "default",
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
});

redisClient.on("error", (err) => {
  console.error("[Redis] Connection Error:", err.message);
});

redisClient.on("connect", () => {
  console.log("[Redis] Connected successfully");
});

// Connect Redis with error handling
// Connect Redis with error handling
try {
  await redisClient.connect();
  console.log(
    "[Redis] Connected to",
    process.env.REDIS_HOST + ":" + process.env.REDIS_PORT,
  );
} catch (error) {
  console.error("[Redis] Failed to connect:", error.message);
  console.error(
    "Redis is required for production. Please ensure Redis is running or configure REDIS_HOST, REDIS_PORT, REDIS_PASSWORD.",
  );
  process.exit(1);
}

// Configure session store
const sessionStore = new RedisStore({
  client: redisClient,
  prefix: "Tadabbur-session:",
});

// Session configuration
const sessionConfig = {
  store: sessionStore,
  secret: process.env.SESSION_SECRET_KEY,
  resave: false,
  saveUninitialized: false,
  name: "tadabbur-session", // Custom session cookie name
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
