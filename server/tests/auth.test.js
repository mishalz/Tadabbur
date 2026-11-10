import { skipReason } from "./helpers/env.js";
import { describe, test, before, after, beforeEach, mock } from "node:test";
import assert from "node:assert/strict";
import axios from "axios";
import { installFakeQf } from "./helpers/fakeQf.js";
import { startApp, resetTables, loginAs, apiClient } from "./helpers/testApp.js";

describe("auth", { skip: skipReason }, () => {
  let app, qf;

  before(async () => {
    qf = installFakeQf();
    app = await startApp();
  });
  after(async () => {
    qf.restore();
    await app.close();
  });
  beforeEach(async () => {
    qf.reset();
    await resetTables(app.pool);
  });

  test("login returns an authorization URL with PKCE, state and nonce, and an httpOnly session cookie", async () => {
    const response = await fetch(`${app.base}/api/auth/login`);
    const { authUrl } = await response.json();
    const params = new URL(authUrl).searchParams;

    assert.equal(params.get("response_type"), "code");
    assert.equal(params.get("code_challenge_method"), "S256");
    assert.equal(params.get("redirect_uri"), "http://localhost:5173/callback");
    assert.equal(params.get("client_id"), "test-client-id");
    for (const name of ["state", "nonce", "code_challenge"]) assert.ok(params.get(name), `${name} present`);

    const cookie = response.headers.get("set-cookie");
    assert.match(cookie, /^tadabbur-session=/);
    assert.match(cookie, /HttpOnly/i);
  });

  test("a full login makes the user available from /me and the content routes, and logout ends the session", async () => {
    const cookie = await loginAs(app.base, { first_name: "Ada", last_name: "Lovelace" });
    const api = apiClient(app.base, cookie);

    const me = await (await api("/api/auth/me")).json();
    assert.equal(me.user.sub, "user-1");
    assert.equal(me.user.first_name, "Ada");

    // authenticated: 404 means "no connections", not 401
    assert.equal((await api("/api/content/connections/1:1/count")).status, 404);

    assert.equal((await api("/api/auth/logout")).status, 200);
    assert.equal((await api("/api/auth/me")).status, 401);
    assert.equal((await api("/api/content/connections/1:1/count")).status, 401);
  });

  test("/me without a session is 401", async () => {
    assert.equal((await apiClient(app.base)("/api/auth/me")).status, 401);
  });

  test("a wrong state is rejected (CSRF) and neither the state nor the cookie is logged", async () => {
    const login = await fetch(`${app.base}/api/auth/login`);
    const cookie = login.headers.get("set-cookie").split(";")[0];

    const logged = [];
    const capture = (...args) => logged.push(args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" "));
    const errorMock = mock.method(console, "error", capture);
    const logMock = mock.method(console, "log", capture);
    let response;
    try {
      response = await fetch(`${app.base}/api/auth/qf/exchange`, {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie },
        body: JSON.stringify({ code: "code", state: "ATTACKER-STATE-123" }),
      });
    } finally {
      errorMock.mock.restore();
      logMock.mock.restore();
    }

    assert.equal(response.status, 403);
    const output = logged.join("\n");
    assert.ok(output.includes("State validation failed"));
    assert.ok(!output.includes("ATTACKER-STATE-123"));
    assert.ok(!output.includes(cookie.split("=")[1]));
  });

  test("an id_token with the wrong nonce is rejected", async () => {
    const login = await fetch(`${app.base}/api/auth/login`);
    const cookie = login.headers.get("set-cookie").split(";")[0];
    const state = new URL((await login.json()).authUrl).searchParams.get("state");

    const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
    const post = mock.method(axios, "post", async () => ({
      data: { access_token: "t", expires_in: 3600, id_token: `${b64({})}.${b64({ sub: "x", nonce: "wrong" })}.s` },
    }));
    try {
      const response = await fetch(`${app.base}/api/auth/qf/exchange`, {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie },
        body: JSON.stringify({ code: "code", state }),
      });
      assert.equal(response.status, 403);
    } finally {
      post.mock.restore();
    }
  });

  test("an expired access token is refreshed server-side on the next content request", async () => {
    const cookie = await loginAs(app.base);
    await app.pool.query(
      `UPDATE session SET sess = jsonb_set(sess::jsonb, '{tokenExpiresAt}', '1'::jsonb)::json`,
    );

    const refresh = mock.method(axios, "post", async () => ({
      data: { access_token: "refreshed-token", expires_in: 3600 },
    }));
    qf.setHandler((url) => (url.pathname.startsWith("/auth/v1/bookmarks") ? { status: 200, body: { data: [] } } : undefined));
    try {
      const response = await apiClient(app.base, cookie)("/api/content/bookmarks");
      assert.equal(response.status, 200);
      assert.equal(refresh.mock.callCount(), 1);
      const upstream = qf.calls.find((c) => c.url.pathname.startsWith("/auth/v1/bookmarks"));
      assert.equal(upstream.headers["x-auth-token"], "refreshed-token");
    } finally {
      refresh.mock.restore();
    }
  });

  test("when the refresh fails the user gets 401", async () => {
    const cookie = await loginAs(app.base);
    await app.pool.query(`UPDATE session SET sess = jsonb_set(sess::jsonb, '{tokenExpiresAt}', '1'::jsonb)::json`);

    const refresh = mock.method(axios, "post", async () => {
      throw new Error("invalid_grant");
    });
    const errorMock = mock.method(console, "error", () => {});
    try {
      assert.equal((await apiClient(app.base, cookie)("/api/content/bookmarks")).status, 401);
    } finally {
      refresh.mock.restore();
      errorMock.mock.restore();
    }
  });
});
