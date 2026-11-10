import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const serverDir = fileURLToPath(new URL("..", import.meta.url));

// config.js is evaluated at import time, so each case runs in a clean child
// process (with .env loading disabled) to control the environment exactly.
const loadConfig = (env) =>
  spawnSync(
    process.execPath,
    ["-e", 'import("./config.js").then(m => console.log(JSON.stringify(m.default)))'],
    { cwd: serverDir, env: { PATH: process.env.PATH, DOTENV_CONFIG_PATH: "/nonexistent", ...env }, encoding: "utf8" },
  );

const valid = { SESSION_SECRET_KEY: "s", DATABASE_URL: "postgres://u:p@localhost/db" };

describe("config", () => {
  test("fails fast, naming what is missing", () => {
    const result = loadConfig({});
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /SESSION_SECRET_KEY, DATABASE_URL/);
  });

  test("requires APP_BASE_URL in production only", () => {
    assert.notEqual(loadConfig({ ...valid, NODE_ENV: "production" }).status, 0);
    assert.equal(loadConfig({ ...valid, NODE_ENV: "production", APP_BASE_URL: "https://app.example" }).status, 0);
    assert.equal(loadConfig({ ...valid }).status, 0);
  });

  test("cookie settings: lax in development, none+secure in production, overridable", () => {
    const parse = (env) => JSON.parse(loadConfig({ ...valid, APP_BASE_URL: "https://a.example", ...env }).stdout).cookie;

    assert.deepEqual([parse({}).sameSite, parse({}).secure], ["lax", false]);
    assert.deepEqual([parse({ NODE_ENV: "production" }).sameSite, parse({ NODE_ENV: "production" }).secure], ["none", true]);
    assert.equal(parse({ NODE_ENV: "production", COOKIE_SAMESITE: "lax" }).sameSite, "lax");
    assert.equal(parse({ NODE_ENV: "production", COOKIE_SAMESITE: "bogus" }).sameSite, "none");
    // stray whitespace/case from a dashboard is tolerated
    assert.equal(parse({ NODE_ENV: "production", COOKIE_SAMESITE: " Lax " }).sameSite, "lax");
  });
});

describe("config warnings", () => {
  test("an invalid COOKIE_SAMESITE is reported instead of silently ignored", () => {
    const result = loadConfig({ ...valid, COOKIE_SAMESITE: "bogus" });
    assert.match(result.stderr, /Ignoring invalid COOKIE_SAMESITE "bogus"/);
  });
});
