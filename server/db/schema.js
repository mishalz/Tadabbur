import pool from "./pool.js";

/**
 * Idempotent schema. Safe to run on every start.
 *
 * verses       – local copy of the verse text shown in connections
 * session      – login sessions (see connect-pg-simple in index.js)
 * connections  – a user's note linking two verses. Direction-independent:
 *                the unique index on LEAST/GREATEST stops (a,b) and (b,a)
 *                both existing for the same user.
 */
const SCHEMA = `
CREATE TABLE IF NOT EXISTS verses (
  key         TEXT PRIMARY KEY,
  arabic_text TEXT NOT NULL DEFAULT '',
  translation TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS connections (
  id         BIGSERIAL PRIMARY KEY,
  user_sub   TEXT NOT NULL,
  from_verse TEXT NOT NULL REFERENCES verses(key),
  to_verse   TEXT NOT NULL REFERENCES verses(key),
  note       TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (from_verse <> to_verse)
);

CREATE UNIQUE INDEX IF NOT EXISTS connections_user_pair_uniq
  ON connections (user_sub, LEAST(from_verse, to_verse), GREATEST(from_verse, to_verse));
CREATE INDEX IF NOT EXISTS connections_user_from_idx ON connections (user_sub, from_verse);
CREATE INDEX IF NOT EXISTS connections_user_to_idx   ON connections (user_sub, to_verse);

-- express-session store (same layout connect-pg-simple expects)
CREATE TABLE IF NOT EXISTS "session" (
  "sid"    VARCHAR NOT NULL PRIMARY KEY,
  "sess"   JSON NOT NULL,
  "expire" TIMESTAMP(6) NOT NULL
);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
`;

let schemaPromise = null;

/**
 * Resolves once the schema exists. The result is memoised, but a failure is
 * not: if the database is still waking up the next call retries.
 */
export const ensureSchema = () => {
  if (!schemaPromise) {
    schemaPromise = pool.query(SCHEMA).catch((err) => {
      schemaPromise = null;
      throw err;
    });
  }
  return schemaPromise;
};
