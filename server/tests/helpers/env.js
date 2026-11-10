/**
 * Must be the FIRST import of every test file: it points the app at the test
 * database and sets the rest of the environment before config.js is loaded.
 *
 * Safety: the suite truncates tables, so it only ever uses TEST_DATABASE_URL
 * (never DATABASE_URL from .env, which may be production) and refuses remote
 * hosts unless ALLOW_REMOTE_TEST_DB=1.
 */
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "postgres"]);

const isSafeTestDatabase = (url) => {
  try {
    const { hostname } = new URL(url);
    return LOCAL_HOSTS.has(hostname) || process.env.ALLOW_REMOTE_TEST_DB === "1";
  } catch {
    return false;
  }
};

const testDatabaseUrl = process.env.TEST_DATABASE_URL;

export const dbAvailable = Boolean(testDatabaseUrl) && isSafeTestDatabase(testDatabaseUrl);

if (testDatabaseUrl && !dbAvailable) {
  console.warn(
    "[tests] TEST_DATABASE_URL is not a local database; database tests are skipped " +
      "(set ALLOW_REMOTE_TEST_DB=1 to override).",
  );
}

Object.assign(process.env, {
  // A dummy URL keeps imports working when the DB tests are skipped.
  DATABASE_URL: dbAvailable ? testDatabaseUrl : "postgres://skip:skip@127.0.0.1:1/skip",
  DATABASE_SSL: "false",
  NODE_ENV: "test",
  SESSION_SECRET_KEY: "test-session-secret",
  APP_BASE_URL: "http://localhost:5173",
  QF_ENV: "prelive",
  QF_CLIENT_ID_DEV: "test-client-id",
  QF_CLIENT_SECRET_DEV: "test-client-secret",
  QF_SCOPE: "openid offline_access user",
});

export const skipReason = dbAvailable
  ? false
  : "set TEST_DATABASE_URL to a local Postgres database to run these tests";
