import { getQfConfig } from "../../../qfConfig.js";
import { getJsonData } from "../../quran-retrieval/quran.service.js";

export const addBookmarkToQF = async (verse_key, userToken) => {
  //Extract the surah number (sn) and verse number (vn) from the verse_key where verse_key is in the format "sn:vn"
  const [surah_number, verse_number] = verse_key.split(":");
  const { apiBaseUrl, clientId } = getQfConfig();

  let data = JSON.stringify({
    key: surah_number,
    type: "ayah",
    verseNumber: verse_number,
    isReading: true,
    mushafId: 4,
    mushaf: 4,
  });

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: `${apiBaseUrl}/auth/v1/bookmarks`,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-auth-token": userToken,
      "x-client-id": clientId,
    },
    data: data,
  };

  const response = await fetch(config.url, {
    method: config.method,
    headers: config.headers,
    maxBodyLength: config.maxBodyLength,
    body: config.data,
  });
  if (!response.ok) {
    throw new Error(`Failed to add bookmark.`);
  }
  const result = await response.json();
  return { success: true, bookmark: true, bookmarkId: result.data.id };
};

export const getAllBookmarksfromQF = async (
  userToken,
  { first = 20, after = null } = {},
) => {
  const { apiBaseUrl, clientId } = getQfConfig();

  // Build URL with pagination parameters
  const params = new URLSearchParams({
    mushafId: 4,
    first: Math.min(first, 20), // Ensure first is between 1-20
  });

  if (after) {
    params.append("after", after);
  }

  const url = `${apiBaseUrl}/auth/v1/bookmarks?${params.toString()}`;

  const response = await fetch(url, {
    method: "get",
    headers: {
      Accept: "application/json",
      "x-auth-token": userToken,
      "x-client-id": clientId,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to retrieve bookmarks.");
  }

  const data = await response.json();

  // Extract bookmarks and pagination info from the response
  const bookmarks = data.data || [];
  const updatedBookmarks = await Promise.all(
    bookmarks.map(async (element) => {
      const response = await getJsonData(
        `/content/api/v4//verses/by_key/${element.key}:${element.verseNumber}?fields=text_uthmani&translations=85`,
      );

      const text_uthmani = response.data.verse.text_uthmani;
      const translation = response.data.verse.translations[0].text;

      return { ...element, text_uthmani, translation };
    }),
  );
  const pagination = data.pagination || {};
  updatedBookmarks.sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );
  return {
    success: true,
    bookmarks: updatedBookmarks,
    pagination: {
      hasNextPage: pagination.hasNextPage || false,
      endCursor: pagination.endCursor || null,
    },
  };
};
export const getBookmarkFromQF = async (verse_key, userToken) => {
  const [surah_number, verse_number] = verse_key.split(":");
  const { apiBaseUrl, clientId } = getQfConfig();
  let config = {
    method: "get",
    maxBodyLength: Infinity,
    url: `${apiBaseUrl}/auth/v1/bookmarks/bookmark?key=${surah_number}&verseNumber=${verse_number}&type=ayah&mushaf=4`,
    headers: {
      Accept: "application/json",
      "x-auth-token": userToken,
      "x-client-id": clientId,
    },
  };
  const response = await fetch(config.url, {
    method: config.method,
    headers: config.headers,
    maxBodyLength: config.maxBodyLength,
  });
  if (!response.ok) {
    if (response.status === 404) {
      return { success: true, bookmark: false, bookmarkId: null };
    }
    throw new Error(`Failed to retrieve bookmark: ${response.status}`);
  }
  const data = await response.json();

  return { success: true, bookmark: true, bookmarkId: data.data.id };
};

export const removeBookmarkFromQF = async (bookmarkId, userToken) => {
  const { apiBaseUrl, clientId } = getQfConfig();
  let config = {
    method: "delete",
    maxBodyLength: Infinity,
    url: `https://apis-prelive.quran.foundation/auth/v1/bookmarks/${bookmarkId}`,
    headers: {
      Accept: "application/json",
      "x-auth-token": userToken,
      "x-client-id": clientId,
    },
  };
  const response = await fetch(config.url, {
    method: config.method,
    headers: config.headers,
    maxBodyLength: config.maxBodyLength,
  });
  if (!response.ok) {
    throw new Error("Failed to remove bookmark");
  }
  const data = await response.json();

  return { success: true, message: "Bookmark removed successfully" };
};
