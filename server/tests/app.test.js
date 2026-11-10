import { dbAvailable } from "./helpers/env.js";
import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { startApp } from "./helpers/testApp.js";

describe("app", () => {
  let app;
  before(async () => {
    app = await startApp({ schema: false });
  });
  after(() => app.close());

  test("/ping answers without touching the database", async () => {
    const response = await fetch(`${app.base}/ping`);
    assert.equal(response.status, 200);
    assert.equal(await response.text(), "ok");
  });

  test("/healthz reflects database availability", async () => {
    const response = await fetch(`${app.base}/healthz`);
    assert.equal(response.status, dbAvailable ? 200 : 503);
  });

  test("unknown routes return a JSON 404", async () => {
    const response = await fetch(`${app.base}/nope`);
    assert.equal(response.status, 404);
    assert.equal((await response.json()).success, false);
  });

  test("malformed JSON returns a JSON 400 without leaking details", async () => {
    const response = await fetch(`${app.base}/api/auth/qf/exchange`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{bad",
    });
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { success: false, message: "Invalid request body" });
  });

  test("security headers are set and the framework is not advertised", async () => {
    const response = await fetch(`${app.base}/ping`);
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.equal(response.headers.get("x-powered-by"), null);
  });

  test("CORS only allows the configured frontend origin", async () => {
    const allowed = await fetch(`${app.base}/ping`, { headers: { Origin: "http://localhost:5173" } });
    assert.equal(allowed.headers.get("access-control-allow-origin"), "http://localhost:5173");
    assert.equal(allowed.headers.get("access-control-allow-credentials"), "true");

    const other = await fetch(`${app.base}/ping`, { headers: { Origin: "https://evil.example" } });
    assert.notEqual(other.headers.get("access-control-allow-origin"), "https://evil.example");
  });

  test("auth endpoints are rate limited", async () => {
    const statuses = [];
    for (let i = 0; i < 65; i++) {
      statuses.push((await fetch(`${app.base}/api/auth/me`)).status);
    }
    assert.equal(statuses[0], 401);
    assert.equal(statuses.at(-1), 429);
  });
});
