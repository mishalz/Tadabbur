import {
  addBookmarkToQF,
  getBookmarkFromQF,
  removeBookmarkFromQF,
  getAllBookmarksfromQF,
} from "./bookmarks.service.js";
import { getBookmarks } from "./user-api.controller.js";

const getAllBookmarks = async (req, res) => {
  try {
    const userToken = req.user.token;

    // Extract pagination parameters from query string
    const first = req.query.first ? parseInt(req.query.first, 10) : 20;
    const after = req.query.after || null;

    const bookmarks = await getAllBookmarksfromQF(userToken, { first, after });

    if (bookmarks.success)
      return res.status(200).send({
        success: true,
        bookmarks: bookmarks.bookmarks,
        pagination: {
          hasNextPage: bookmarks.pagination.hasNextPage,
          endCursor: bookmarks.pagination.endCursor,
        },
      });
  } catch (err) {
    return res.status(500).send({
      success: false,
      message: "An error occurred while retrieving bookmarks.",
    });
  }
};

const getBookmark = async (req, res) => {
  try {
    const verseKey = req.params.verse_key;
    const userToken = req.user.token;

    const bookmark = await getBookmarkFromQF(verseKey, userToken);
    if (bookmark.success) {
      return res.status(200).send({
        success: true,
        bookmark: bookmark.bookmark,
        bookmarkId: bookmark.bookmarkId,
      });
    } else {
      throw new Error();
    }
  } catch (err) {
    // In case of an error
    return res.status(500).send({
      success: false,
      message: "Failed to retrieve bookmark.",
    });
  }
};

const addBookmark = async (req, res) => {
  // This is a placeholder implementation. You would replace this with actual logic to add a bookmark.
  try {
    const verseKey = req.body.verseKey;
    const userToken = req.user.token;

    const bookmarkData = await addBookmarkToQF(verseKey, userToken);

    if (bookmarkData.success) {
      // Simulating a successful bookmark addition
      return res.status(201).send({
        success: true,
        Bookmark: true,
        bookmarkId: bookmarkData.bookmarkId,
      });
    } else {
      return res
        .status(400)
        .send({ success: false, message: "Failed to add bookmark." });
    }
  } catch (err) {
    // In case of an error
    return res.status(500).send({
      success: false,
      message: "Failed to add bookmark.",
    });
  }
};

const removeBookmark = async (req, res) => {
  try {
    const bookmarkId = req.params.id;
    const userToken = req.user.token;

    const bookmarkRemoved = await removeBookmarkFromQF(bookmarkId, userToken);

    if (bookmarkRemoved.success) {
      return res.status(200).send({
        success: true,
        message: "Bookmark removed successfully",
      });
    } else {
      return res.status(400).send({
        success: false,
        message: "Failed to remove bookmark.",
      });
    }
  } catch (err) {
    return res.status(500).send({
      success: false,
      message: "Failed to remove bookmark.",
    });
  }
};

export default {
  getAllBookmarks,
  getBookmark,
  addBookmark,
  removeBookmark,
};
