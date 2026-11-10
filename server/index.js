import app from "./app.js";
import config from "./config.js";
import pool from "./db/pool.js";
import { ensureSchema } from "./db/schema.js";

// Create tables in the background; a failure (e.g. a suspended free-tier
// database still waking up) is logged and retried on the next query, never fatal.
ensureSchema()
  .then(() => console.log("[DB] Schema ready"))
  .catch((err) => console.error("[DB] Schema setup failed:", err.message));

const server = app.listen(config.port, () => {
  console.log(`[Server] Listening on port ${config.port} (${config.env})`);
});

// Graceful shutdown: stop taking new requests, let in-flight ones finish,
// then release database connections. Render sends SIGTERM on every deploy.
const shutdown = (signal) => {
  console.log(`[Server] ${signal} received, shutting down`);
  server.close(async () => {
    await pool.end().catch(() => {});
    process.exit(0);
  });
  // Do not hang forever on stuck connections.
  setTimeout(() => process.exit(1), 10_000).unref();
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

export default server;
