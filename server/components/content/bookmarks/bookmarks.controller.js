import {
  addBookmarkToQF,
  getBookmarkFromQF,
  removeBookmarkFromQF,
  getAllBookmarksfromQF,
} from "./bookmarks.service.js";
import { VERSE_KEY_PATTERN } from "../../quran-retrieval/quran.service.js";

const BOOKMARK_ID_PATTERN = /^[\w-]{1,64}$/;
const MAX_PAGE_SIZE = 20;

const fail = (res, status, message) =>
  res.status(status).send({ success: false, message });

// Respond with the upstream-derived status when there is one (401/404/502),
// otherwise a plain 500; the message stays generic.
const handleError = (res, error, message) => {
  console.error(`[Bookmarks] ${message}`, error.message);
  return fail(res, error.statusCode || 500, message);
};

const getAllBookmarks = async (req, res) => {
  const first = Number.parseInt(req.query.first, 10);
  const pageSize =
    Number.isInteger(first) && first > 0 ? Math.min(first, MAX_PAGE_SIZE) : MAX_PAGE_SIZE;
  const after =
    typeof req.query.after === "string" && req.query.after.length <= 200
      ? req.query.after
      : null;

  try {
    const { bookmarks, pagination } = await getAllBookmarksfromQF(req.user.token, {
      first: pageSize,
      after,
    });
    return res.status(200).send({ success: true, bookmarks, pagination });
  } catch (error) {
    return handleError(res, error, "An error occurred while retrieving bookmarks.");
  }
};

const getBookmark = async (req, res) => {
  const verseKey = req.params.verse_key;
  if (!VERSE_KEY_PATTERN.test(verseKey)) {
    return fail(res, 422, "Invalid verse key.");
  }

  try {
    const { bookmark, bookmarkId } = await getBookmarkFromQF(verseKey, req.user.token);
    return res.status(200).send({ success: true, bookmark, bookmarkId });
  } catch (error) {
    return handleError(res, error, "Failed to retrieve bookmark.");
  }
};

const addBookmark = async (req, res) => {
  const verseKey = req.body?.verseKey;
  if (typeof verseKey !== "string" || !VERSE_KEY_PATTERN.test(verseKey)) {
    return fail(res, 422, "Invalid verse key.");
  }

  try {
    const { bookmarkId } = await addBookmarkToQF(verseKey, req.user.token);
    return res.status(201).send({ success: true, bookmark: true, bookmarkId });
  } catch (error) {
    return handleError(res, error, "Failed to add bookmark.");
  }
};

const removeBookmark = async (req, res) => {
  const bookmarkId = req.params.id;
  if (!BOOKMARK_ID_PATTERN.test(bookmarkId)) {
    return fail(res, 422, "Invalid bookmark id.");
  }

  try {
    await removeBookmarkFromQF(bookmarkId, req.user.token);
    return res
      .status(200)
      .send({ success: true, message: "Bookmark removed successfully" });
  } catch (error) {
    return handleError(res, error, "Failed to remove bookmark.");
  }
};

export default { getAllBookmarks, getBookmark, addBookmark, removeBookmark };
