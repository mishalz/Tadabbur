import { skipReason } from "./helpers/env.js";
import { describe, test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { installFakeQf } from "./helpers/fakeQf.js";
import { startApp, resetTables, loginAs, apiClient } from "./helpers/testApp.js";

const isBookmarksApi = (url) => url.pathname.startsWith("/auth/v1/bookmarks");

describe("bookmarks API", { skip: skipReason }, () => {
  let app, qf, api;

  before(async () => {
    qf = installFakeQf();
    app = await startApp();
    await resetTables(app.pool);
    api = apiClient(app.base, await loginAs(app.base));
  });
  after(async () => {
    qf.restore();
    await app.close();
  });
  beforeEach(() => qf.reset());

  test("requires a logged-in session", async () => {
    assert.equal((await apiClient(app.base)("/api/content/bookmarks")).status, 401);
  });

  test("adds a bookmark using the user's token and the configured API base", async () => {
    qf.setHandler((url) => (isBookmarksApi(url) ? { status: 200, body: { data: { id: "bm-1" } } } : undefined));

    const response = await api("/api/content/bookmarks", { method: "POST", body: { verseKey: "2:255" } });
    assert.equal(response.status, 201);
    assert.deepEqual(await response.json(), { success: true, bookmark: true, bookmarkId: "bm-1" });

    const call = qf.calls.find((c) => isBookmarksApi(c.url));
    assert.equal(call.url.origin, "https://apis-prelive.quran.foundation");
    assert.equal(call.headers["x-auth-token"], "user-access-token");
    assert.equal(call.headers["x-client-id"], "test-client-id");
    assert.deepEqual(JSON.parse(call.body).verseNumber, "255");
  });

  test("validates the verse key, bookmark id and never calls upstream for bad input", async () => {
    assert.equal((await api("/api/content/bookmarks", { method: "POST", body: { verseKey: "nope" } })).status, 422);
    assert.equal((await api("/api/content/bookmarks/bookmark/abc")).status, 422);
    assert.equal((await api("/api/content/bookmarks/..%2Fusers", { method: "DELETE" })).status, 422);
    assert.equal(qf.calls.filter((c) => isBookmarksApi(c.url)).length, 0);
  });

  test("reports whether a verse is bookmarked (404 upstream = not bookmarked)", async () => {
    qf.setHandler((url) => (isBookmarksApi(url) ? { status: 404, body: {} } : undefined));
    const none = await (await api("/api/content/bookmarks/bookmark/1:1")).json();
    assert.deepEqual([none.bookmark, none.bookmarkId], [false, null]);

    qf.setHandler((url) => (isBookmarksApi(url) ? { status: 200, body: { data: { id: "bm-9" } } } : undefined));
    const found = await (await api("/api/content/bookmarks/bookmark/1:1")).json();
    assert.deepEqual([found.bookmark, found.bookmarkId], [true, "bm-9"]);
  });

  test("removes a bookmark via the configured API base", async () => {
    qf.setHandler((url) => (isBookmarksApi(url) ? { status: 200, body: {} } : undefined));
    assert.equal((await api("/api/content/bookmarks/bm-1", { method: "DELETE" })).status, 200);
    const call = qf.calls.find((c) => c.method === "DELETE");
    assert.equal(call.url.href, "https://apis-prelive.quran.foundation/auth/v1/bookmarks/bm-1");
  });

  test("lists bookmarks, enriched with verse text, newest first; a failing verse does not fail the page", async () => {
    qf.setHandler((url) => {
      if (isBookmarksApi(url)) {
        return {
          status: 200,
          body: {
            data: [
              { id: "a", key: 1, verseNumber: 1, createdAt: "2026-01-01" },
              { id: "b", key: 1, verseNumber: 2, createdAt: "2026-02-01" },
              { id: "c", key: 1, verseNumber: 3, createdAt: "2026-03-01" },
            ],
            pagination: { hasNextPage: true, endCursor: "cur" },
          },
        };
      }
      return url.pathname.endsWith("/1:2") ? { status: 500, body: {} } : undefined;
    });

    const body = await (await api("/api/content/bookmarks?first=500")).json();
    assert.deepEqual(body.bookmarks.map((b) => b.id), ["c", "b", "a"]);
    assert.equal(body.bookmarks[0].translation, "translation 1:3");
    assert.equal(body.bookmarks[1].translation, ""); // the failing verse, returned without text
    assert.deepEqual(body.pagination, { hasNextPage: true, endCursor: "cur" });

    const listCall = qf.calls.find((c) => isBookmarksApi(c.url));
    assert.equal(listCall.url.searchParams.get("first"), "20"); // clamped to the API maximum
  });

  test("passes an expired/invalid upstream token through as 401 and other failures as 502", async () => {
    qf.setHandler((url) => (isBookmarksApi(url) ? { status: 401, body: {} } : undefined));
    assert.equal((await api("/api/content/bookmarks")).status, 401);

    qf.setHandler((url) => (isBookmarksApi(url) ? { status: 500, body: {} } : undefined));
    assert.equal((await api("/api/content/bookmarks")).status, 502);
  });
});
