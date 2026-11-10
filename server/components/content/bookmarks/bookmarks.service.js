import { getQfConfig } from "../../../qfConfig.js";
import { getVerseData } from "../../quran-retrieval/quran.service.js";

// Quran Foundation's mushaf used for all bookmarks (matches the translation text shown in the app).
const MUSHAF_ID = 4;
const MAX_PAGE_SIZE = 20; // upper limit enforced by the Quran Foundation API
const REQUEST_TIMEOUT_MS = 15_000;

const splitVerseKey = (verseKey) => {
  const [surahNumber, verseNumber] = verseKey.split(":");
  return { surahNumber, verseNumber };
};

// Upstream failures keep a meaningful status for our own response:
// 401 (token rejected) and 404 pass through, anything else is a bad gateway.
const upstreamError = (message, upstreamStatus) => {
  const error = new Error(message);
  error.upstreamStatus = upstreamStatus;
  error.statusCode = [401, 404].includes(upstreamStatus) ? upstreamStatus : 502;
  return error;
};

/**
 * Call the Quran Foundation user API ({apiBaseUrl}/auth/v1{path}) on behalf
 * of the logged-in user. Returns the raw Response so callers decide how to
 * treat non-2xx statuses.
 */
const qfUserApi = (path, userToken, { method = "GET", body } = {}) => {
  const { apiBaseUrl, clientId } = getQfConfig();
  return fetch(`${apiBaseUrl}/auth/v1${path}`, {
    method,
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
      "x-auth-token": userToken,
      "x-client-id": clientId,
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
};

export const addBookmarkToQF = async (verseKey, userToken) => {
  const { surahNumber, verseNumber } = splitVerseKey(verseKey);

  const response = await qfUserApi("/bookmarks", userToken, {
    method: "POST",
    body: {
      key: surahNumber,
      type: "ayah",
      verseNumber,
      isReading: true,
      mushafId: MUSHAF_ID,
      mushaf: MUSHAF_ID,
    },
  });
  if (!response.ok) {
    throw upstreamError("Failed to add bookmark.", response.status);
  }

  const result = await response.json();
  return { success: true, bookmark: true, bookmarkId: result.data.id };
};

export const getAllBookmarksfromQF = async (
  userToken,
  { first = MAX_PAGE_SIZE, after = null } = {},
) => {
  const params = new URLSearchParams({
    mushafId: MUSHAF_ID,
    first: Math.min(first, MAX_PAGE_SIZE),
  });
  if (after) params.append("after", after);

  const response = await qfUserApi(`/bookmarks?${params}`, userToken);
  if (!response.ok) {
    throw upstreamError("Failed to retrieve bookmarks.", response.status);
  }

  const { data = [], pagination = {} } = await response.json();

  // Attach the verse text. A verse that cannot be loaded is returned without
  // text instead of failing the whole page of bookmarks.
  const bookmarks = await Promise.all(
    data.map(async (bookmark) => {
      try {
        const { verse } = await getVerseData(
          `${bookmark.key}:${bookmark.verseNumber}`,
        );
        return {
          ...bookmark,
          text_uthmani: verse.text_uthmani,
          translation: verse.translations?.[0]?.text ?? "",
        };
      } catch (error) {
        console.error(
          `[Bookmarks] Could not load verse ${bookmark.key}:${bookmark.verseNumber}:`,
          error.message,
        );
        return { ...bookmark, text_uthmani: "", translation: "" };
      }
    }),
  );

  bookmarks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return {
    success: true,
    bookmarks,
    pagination: {
      hasNextPage: pagination.hasNextPage || false,
      endCursor: pagination.endCursor || null,
    },
  };
};

export const getBookmarkFromQF = async (verseKey, userToken) => {
  const { surahNumber, verseNumber } = splitVerseKey(verseKey);
  const params = new URLSearchParams({
    key: surahNumber,
    verseNumber,
    type: "ayah",
    mushaf: MUSHAF_ID,
  });

  const response = await qfUserApi(`/bookmarks/bookmark?${params}`, userToken);
  if (response.status === 404) {
    return { success: true, bookmark: false, bookmarkId: null };
  }
  if (!response.ok) {
    throw upstreamError("Failed to retrieve bookmark.", response.status);
  }

  const { data } = await response.json();
  return { success: true, bookmark: true, bookmarkId: data.id };
};

export const removeBookmarkFromQF = async (bookmarkId, userToken) => {
  const response = await qfUserApi(
    `/bookmarks/${encodeURIComponent(bookmarkId)}`,
    userToken,
    { method: "DELETE" },
  );
  if (!response.ok) {
    throw upstreamError("Failed to remove bookmark.", response.status);
  }
  return { success: true, message: "Bookmark removed successfully" };
};
