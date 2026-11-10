import "dotenv/config";

import { getQfConfig } from "../../qfConfig.js";
import { ResourceNotFoundError } from "../../utils/Errors.js";

let cachedToken = null;
let expiresAt = 0;
let inflightTokenPromise = null;

async function fetchToken() {
  const { authBaseUrl, clientId, clientSecret } = getQfConfig();

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64",
  );

  const response = await fetch(`${authBaseUrl}/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope: "content",
    }),
  });

  if (!response.ok) {
    throw new Error(`Token request failed: ${response.status}`);
  }

  const token = await response.json();
  cachedToken = token.access_token;
  expiresAt = Date.now() + token.expires_in * 1000;
  return cachedToken;
}

export async function getAccessToken() {
  if (cachedToken && Date.now() < expiresAt - 30_000) {
    return cachedToken;
  }

  if (!inflightTokenPromise) {
    inflightTokenPromise = fetchToken().finally(() => {
      inflightTokenPromise = null;
    });
  }

  return inflightTokenPromise;
}

export function clearToken() {
  cachedToken = null;
  expiresAt = 0;
}

// Verse keys look like "2:255". Validating up front also stops a crafted key
// (e.g. "1:1?x=y" or "../chapters") from altering the upstream request path.
export const VERSE_KEY_PATTERN = /^\d{1,3}:\d{1,3}$/;

const REQUEST_TIMEOUT_MS = 15_000;

export async function getJsonData(path, params = {}) {
  const { apiBaseUrl, clientId } = getQfConfig();

  const query = new URLSearchParams(params).toString();
  const url = `${apiBaseUrl}${path}${query ? (path.includes("?") ? "&" : "?") + query : ""}`;

  const request = (token) =>
    fetch(url, {
      headers: {
        "x-auth-token": token,
        "x-client-id": clientId,
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

  let response = await request(await getAccessToken());

  if (response.status === 401) {
    // Token was rejected (e.g. expired early): fetch a fresh one and retry once.
    clearToken();
    response = await request(await getAccessToken());
  }

  if (!response.ok) {
    const error = new Error(`Content API request failed: ${response.status}`);
    error.upstreamStatus = response.status;
    // 404 stays a 404; anything else from upstream is a bad gateway for us.
    error.statusCode = response.status === 404 ? 404 : 502;
    throw error;
  }

  return { success: true, data: await response.json() };
}

export const getVerseData = async (verseKey) => {
  if (!VERSE_KEY_PATTERN.test(String(verseKey))) {
    throw new ResourceNotFoundError(
      `"${verseKey}" is not a valid verse. Use the format surah:verse, for example 2:255.`,
    );
  }

  const notFound = () =>
    new ResourceNotFoundError(`Verse ${verseKey} does not exist.`);

  const url = `/content/api/v4/verses/by_key/${verseKey}?fields=text_uthmani&translations=85`;

  let verseData;
  try {
    ({ data: verseData } = await getJsonData(url));
  } catch (error) {
    // The API answers 400/404 for a verse that does not exist.
    if (error.upstreamStatus === 404 || error.upstreamStatus === 400) {
      throw notFound();
    }
    throw error;
  }

  if (!verseData?.verse) throw notFound();
  return { success: true, verse: verseData.verse };
};
