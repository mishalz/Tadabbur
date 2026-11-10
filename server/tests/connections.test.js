import { skipReason } from "./helpers/env.js";
import { describe, test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { installFakeQf } from "./helpers/fakeQf.js";
import { startApp, resetTables, loginAs, apiClient } from "./helpers/testApp.js";

const verse = (key, translation = "translation") => ({ key, arabicText: "arabic", translation });

describe("connections", { skip: skipReason }, () => {
  let app, svc, qf;

  before(async () => {
    qf = installFakeQf();
    app = await startApp();
    svc = await import("../components/content/connections/connections.service.js");
  });
  after(async () => {
    qf.restore();
    await app.close();
  });
  beforeEach(async () => {
    qf.reset();
    await resetTables(app.pool, ["connections", "verses"]);
  });

  describe("service", () => {
    test("a user only sees their own connections (no cross-user leak)", async () => {
      await svc.saveConnection("A", verse("1:1"), verse("1:2"), "A's note");
      await svc.saveConnection("B", verse("1:3"), verse("1:2"), "B's note");

      await assert.rejects(svc.getVerseConnections("C", "1:2"), { name: "ResourceNotFoundError" });

      const a = await svc.getVerseConnections("A", "1:2");
      assert.deepEqual(a.connections.map((c) => c.note), ["A's note"]);
    });

    test("a connection is found from either verse and in either direction", async () => {
      await svc.saveConnection("A", verse("1:1"), verse("1:2"), "note");

      assert.equal((await svc.getVerseConnections("A", "1:1")).connections.length, 1);
      assert.equal((await svc.getVerseConnections("A", "1:2")).connections.length, 1);
      assert.equal(await svc.checkConnectionExists("1:2", "1:1", "A"), true);
      assert.equal(await svc.checkConnectionExists("1:1", "1:2", "B"), false);
    });

    test("the same pair cannot be connected twice, even reversed", async () => {
      assert.equal((await svc.saveConnection("A", verse("1:1"), verse("1:2"), "x")).success, true);
      assert.equal((await svc.saveConnection("A", verse("1:2"), verse("1:1"), "y")).success, false);
    });

    test("verse text is stored once even if the translation changes", async () => {
      await svc.saveConnection("A", verse("1:1", "first"), verse("1:2"), "x");
      await svc.saveConnection("A", verse("1:3", "other"), verse("1:2", "changed"), "y");

      const { rows } = await app.pool.query("SELECT count(*)::int AS n FROM verses WHERE key = '1:2'");
      assert.equal(rows[0].n, 1);
    });

    test("deleting reports whether anything was removed", async () => {
      await svc.saveConnection("A", verse("1:1"), verse("1:2"), "x");
      assert.equal(await svc.deleteConnectionService("1:2", "1:1", "B"), false);
      assert.equal(await svc.deleteConnectionService("1:2", "1:1", "A"), true);
      assert.equal(await svc.deleteConnectionService("1:2", "1:1", "A"), false);
    });

    test("input validation rejects bad keys and self-connections", () => {
      assert.equal(svc.validateInput({ fromVerse: "x", toVerse: "1:1" }).status, 422);
      assert.equal(svc.validateInput({ fromVerse: "1:1", toVerse: "1:1" }).status, 422);
      assert.equal(svc.validateInput({ fromVerse: "1:1", toVerse: "1:2" }).success, true);
    });

    test("an unknown verse yields a 404 result, a missing translation does not crash", async () => {
      qf.setHandler((url) =>
        url.pathname.endsWith("/999:999") ? { status: 404, body: {} } : undefined,
      );
      const missing = await svc.validateAndGetVersePair("1:1", "999:999");
      assert.deepEqual([missing.success, missing.status], [false, 404]);
      assert.match(missing.message, /^Verse 999:999 does not exist\./);

      qf.setHandler((url) =>
        url.pathname.includes("/verses/by_key/")
          ? { status: 200, body: { verse: { verse_key: "1:1", text_uthmani: "ar" } } }
          : undefined,
      );
      const pair = await svc.validateAndGetVersePair("1:1", "1:2");
      assert.equal(pair.fromVerse.translation, "");
    });
  });

  describe("HTTP API", () => {
    test("requires a logged-in session", async () => {
      const api = apiClient(app.base);
      assert.equal((await api("/api/content/connections/1:1/count")).status, 401);
      assert.equal(
        (await api("/api/content/connections", { method: "POST", body: { fromVerse: "1:1", toVerse: "1:2" } })).status,
        401,
      );
    });

    test("create, list, count and delete a connection", async () => {
      const api = apiClient(app.base, await loginAs(app.base));

      const created = await api("/api/content/connections", {
        method: "POST",
        body: { fromVerse: "1:1", toVerse: "1:2", note: "hello" },
      });
      assert.equal(created.status, 201);

      const duplicate = await api("/api/content/connections", {
        method: "POST",
        body: { fromVerse: "1:2", toVerse: "1:1" },
      });
      assert.equal(duplicate.status, 400);

      const list = await (await api("/api/content/connections/1:1")).json();
      assert.equal(list.connections.length, 1);
      assert.equal(list.connections[0].note, "hello");

      assert.equal((await (await api("/api/content/connections/1:1/count")).json()).count, 1);

      assert.equal((await api("/api/content/connections/1:1/1:2", { method: "DELETE" })).status, 200);
      assert.equal((await api("/api/content/connections/1:1/1:2", { method: "DELETE" })).status, 404);
    });

    test("rejects invalid input with 422 and unknown verses with 404", async () => {
      const api = apiClient(app.base, await loginAs(app.base));

      const self = await api("/api/content/connections", { method: "POST", body: { fromVerse: "1:1", toVerse: "1:1" } });
      assert.equal(self.status, 422);

      qf.setHandler((url) => (url.pathname.endsWith("/999:999") ? { status: 404, body: {} } : undefined));
      const unknown = await api("/api/content/connections", {
        method: "POST",
        body: { fromVerse: "1:1", toVerse: "999:999" },
      });
      assert.equal(unknown.status, 404);
      // a friendly message that names the verse, not an internal error string
      assert.match((await unknown.json()).message, /^Verse 999:999 does not exist\./);
    });

    test("names every missing verse when both do not exist", async () => {
      const api = apiClient(app.base, await loginAs(app.base));
      qf.setHandler((url) => (url.pathname.includes("/verses/by_key/") ? { status: 404, body: {} } : undefined));

      const response = await api("/api/content/connections", {
        method: "POST",
        body: { fromVerse: "2:4444", toVerse: "999:999" },
      });
      assert.equal(response.status, 404);
      assert.match((await response.json()).message, /^Verses 2:4444 and 999:999 do not exist\./);
    });

    test("an upstream outage is reported generically, without leaking internals", async () => {
      const api = apiClient(app.base, await loginAs(app.base));
      qf.setHandler((url) => (url.pathname.includes("/verses/by_key/") ? { status: 500, body: {} } : undefined));

      const response = await api("/api/content/connections", {
        method: "POST",
        body: { fromVerse: "1:1", toVerse: "1:2" },
      });
      assert.equal(response.status, 502);
      const { message } = await response.json();
      assert.equal(message, "Could not create the connection. Please try again.");
      assert.ok(!message.includes("Content API"));
    });
  });
});
