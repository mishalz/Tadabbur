import "dotenv/config";
import pg from "pg";

/**
 * Single shared Postgres pool, used for both app data and sessions.
 *
 * Configure with DATABASE_URL (e.g. from Neon / Supabase / Render Postgres).
 * Managed providers need TLS; node-postgres honours `?sslmode=require` in the
 * URL. Set DATABASE_SSL=false to force-disable TLS (e.g. a local database).
 */
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error(
    "[DB] DATABASE_URL is not set. Database-backed routes will fail until it is configured.",
  );
}

const pool = new pg.Pool({
  connectionString,
  max: 5,
  // Free-tier providers suspend idle databases and drop idle connections;
  // recycle idle clients quickly and fail fast while a suspended DB wakes up.
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 15_000,
  ...(process.env.DATABASE_SSL === "false" ? { ssl: false } : {}),
});

// An error on an idle client (e.g. the provider closed the connection) is
// emitted on the pool; without a listener it would crash the process.
pool.on("error", (err) => {
  console.error("[DB] Idle client error:", err.message);
});

export const query = (text, params) => pool.query(text, params);

export const checkDatabase = async () => {
  await pool.query("SELECT 1");
};

export default pool;
