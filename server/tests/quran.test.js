import "./helpers/env.js";
import { describe, test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { installFakeQf } from "./helpers/fakeQf.js";
import { startApp } from "./helpers/testApp.js";

// These tests need no database: the Quran routes never touch it.
describe("quran content", () => {
  let app, qf, quran;

  before(async () => {
    qf = installFakeQf();
    app = await startApp({ schema: false });
    quran = await import("../components/quran-retrieval/quran.service.js");
  });
  after(async () => {
    qf.restore();
    await app.close();
  });
  beforeEach(() => {
    qf.reset();
    quran.clearToken();
  });

  const upstreamCalls = (fragment) => qf.calls.filter((c) => c.url.pathname.includes(fragment));

  describe("service", () => {
    test("rejects malformed verse keys without any upstream call", async () => {
      for (const key of ["abc", "1:1?x=y", "../chapters", "1:", "1234:1"]) {
        await assert.rejects(quran.getVerseData(key), { name: "ResourceNotFoundError" }, key);
      }
      assert.equal(qf.calls.length, 0);
    });

    test("maps an upstream 404 to ResourceNotFoundError", async () => {
      qf.setHandler((url) => (url.pathname.includes("/verses/") ? { status: 404, body: {} } : undefined));
      await assert.rejects(quran.getVerseData("999:999"), { name: "ResourceNotFoundError" });
    });

    test("fetches a fresh token and retries once when the API rejects the token", async () => {
      let first = true;
      qf.setHandler((url) => {
        if (url.pathname.includes("/verses/") && first) {
          first = false;
          return { status: 401, body: {} };
        }
      });
      const { verse } = await quran.getVerseData("1:1");
      assert.equal(verse.verse_key, "1:1");
      assert.equal(upstreamCalls("/oauth2/token").length, 2);
    });

    test("turns other upstream failures into a 502", async () => {
      qf.setHandler((url) => (url.pathname.includes("/verses/") ? { status: 500, body: {} } : undefined));
      await assert.rejects(quran.getVerseData("1:1"), { statusCode: 502 });
    });

    test("applies the params argument to the request URL", async () => {
      qf.setHandler((url) => (url.pathname.includes("by_chapter") ? { status: 200, body: { verses: [] } } : undefined));
      await quran.getJsonData("/content/api/v4/verses/by_chapter/1", { page: 2, fields: "text_uthmani" });
      const call = upstreamCalls("by_chapter")[0];
      assert.equal(call.url.search, "?page=2&fields=text_uthmani");
    });
  });

  describe("HTTP API", () => {
    test("GET /api/quran/surahs is cached after the first call", async () => {
      qf.setHandler((url) => (url.pathname.endsWith("/chapters") ? { status: 200, body: { chapters: [{ id: 1 }] } } : undefined));
      const first = await fetch(`${app.base}/api/quran/surahs`);
      const second = await fetch(`${app.base}/api/quran/surahs`);
      assert.deepEqual(await first.json(), { chapters: [{ id: 1 }] });
      assert.equal(second.status, 200);
      assert.equal(upstreamCalls("/chapters").length, 1);
    });

    test("GET /api/quran/surahs/:id validates its parameters", async () => {
      for (const path of ["/0", "/115", "/abc", "/1?page=0", "/1?script=bad;drop", "/1?translation_id=x"]) {
        const response = await fetch(`${app.base}/api/quran/surahs${path}`);
        assert.equal(response.status, 422, path);
      }
      assert.equal(upstreamCalls("by_chapter").length, 0);
    });

    test("the surah cache distinguishes script and translation", async () => {
      qf.setHandler((url) => (url.pathname.includes("by_chapter") ? { status: 200, body: { verses: [{ id: 1 }] } } : undefined));
      const get = (query) => fetch(`${app.base}/api/quran/surahs/2?${query}`);

      await get("page=1&script=text_uthmani&translation_id=85");
      await get("page=1&script=text_uthmani&translation_id=85"); // cached
      await get("page=1&script=text_uthmani&translation_id=20"); // different translation
      await get("page=1&script=text_indopak&translation_id=85"); // different script

      assert.equal(upstreamCalls("by_chapter").length, 3);
      const last = upstreamCalls("by_chapter").at(-1).url.searchParams;
      assert.deepEqual([last.get("fields"), last.get("translations")], ["text_indopak", "85"]);
    });

    test("GET /api/quran/verses/:key returns the verse, 404 for unknown or malformed keys", async () => {
      const ok = await fetch(`${app.base}/api/quran/verses/2:255`);
      assert.equal(ok.status, 200);
      assert.equal((await ok.json()).verse.verse_key, "2:255");

      assert.equal((await fetch(`${app.base}/api/quran/verses/abc`)).status, 404);
      qf.setHandler((url) => (url.pathname.includes("/verses/") ? { status: 404, body: {} } : undefined));
      assert.equal((await fetch(`${app.base}/api/quran/verses/999:999`)).status, 404);
    });
  });
});
