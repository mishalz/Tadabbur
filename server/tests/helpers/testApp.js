import http from "node:http";
import { once } from "node:events";
import { mock } from "node:test";
import axios from "axios";

/** Start the real app on an ephemeral port. */
export async function startApp({ schema = true } = {}) {
  const { default: app } = await import("../../app.js");
  const { default: pool } = await import("../../db/pool.js");
  const { ensureSchema } = await import("../../db/schema.js");
  if (schema) await ensureSchema();

  const server = http.createServer(app).listen(0, "127.0.0.1");
  await once(server, "listening");

  return {
    base: `http://127.0.0.1:${server.address().port}`,
    pool,
    async close() {
      server.close();
      await pool.end();
    },
  };
}

export const resetTables = (pool, tables = ["connections", "verses", "session"]) =>
  pool.query(`TRUNCATE ${tables.join(", ")} RESTART IDENTITY CASCADE`);

const base64url = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64url");

/**
 * Log in through the real OAuth flow (login -> exchange) with the Quran
 * Foundation token endpoint stubbed. Returns the session cookie.
 */
export async function loginAs(base, claims = {}) {
  const loginResponse = await fetch(`${base}/api/auth/login`);
  const cookie = loginResponse.headers.get("set-cookie").split(";")[0];
  const authUrl = new URL((await loginResponse.json()).authUrl);

  const post = mock.method(axios, "post", async () => ({
    data: {
      access_token: "user-access-token",
      refresh_token: "user-refresh-token",
      expires_in: 3600,
      token_type: "bearer",
      scope: "openid offline_access user",
      id_token: `${base64url({ alg: "none" })}.${base64url({
        sub: "user-1",
        nonce: authUrl.searchParams.get("nonce"),
        ...claims,
      })}.sig`,
    },
  }));

  try {
    const response = await fetch(`${base}/api/auth/qf/exchange`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie },
      body: JSON.stringify({ code: "code", state: authUrl.searchParams.get("state") }),
    });
    if (response.status !== 200) throw new Error(`login failed: ${response.status}`);
  } finally {
    post.mock.restore();
  }
  return cookie;
}

/** fetch wrapper that sends the session cookie and JSON bodies. */
export const apiClient = (base, cookie) => (path, { method = "GET", body } = {}) =>
  fetch(`${base}${path}`, {
    method,
    headers: { ...(cookie ? { cookie } : {}), ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
