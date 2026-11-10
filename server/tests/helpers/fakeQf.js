/**
 * Replaces global fetch for everything except the local test server, so no
 * test ever reaches Quran Foundation. Requests are recorded in `calls`.
 */
export function installFakeQf() {
  const realFetch = globalThis.fetch;
  const calls = [];
  let handler = null;

  const defaultHandler = (url) => {
    if (url.pathname.endsWith("/oauth2/token")) {
      return { status: 200, body: { access_token: "client-credentials-token", expires_in: 3600 } };
    }
    const verse = url.pathname.match(/\/verses\/by_key\/(\d+:\d+)$/);
    if (verse) {
      return {
        status: 200,
        body: {
          verse: {
            verse_key: verse[1],
            text_uthmani: `arabic ${verse[1]}`,
            translations: [{ text: `translation ${verse[1]}` }],
          },
        },
      };
    }
    return { status: 404, body: {} };
  };

  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    if (url.hostname === "127.0.0.1" || url.hostname === "localhost") {
      return realFetch(input, init);
    }
    calls.push({ url, method: init.method || "GET", headers: init.headers || {}, body: init.body });
    const result = handler?.(url, init) ?? defaultHandler(url, init);
    return { ok: result.status < 300, status: result.status, json: async () => result.body };
  };

  return {
    calls,
    /** (url, init) => {status, body} | undefined (undefined falls back to defaults) */
    setHandler: (fn) => {
      handler = fn;
    },
    reset: () => {
      calls.length = 0;
      handler = null;
    },
    restore: () => {
      globalThis.fetch = realFetch;
    },
  };
}
