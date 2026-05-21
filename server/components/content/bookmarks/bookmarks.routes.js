import express from "express";
const router = express.Router();

import bookmarkController from "./bookmarks.controller.js";

//all routes relating to bookmarks
router.get("/", bookmarkController.getAllBookmarks);
router.post("/", bookmarkController.addBookmark);
router.delete("/:id", bookmarkController.removeBookmark);
router.get("/bookmark/:verse_key", bookmarkController.getBookmark);

//exporting the routes to be integrated into the index.js
export default router;
