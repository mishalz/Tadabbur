const express = require("express");
const router = express.Router();
const bookmarkController = require("./bookmarks.controller");

//all routes relating to bookmarks
router.get("/", bookmarkController.getAllBookmarks);
router.post("/", bookmarkController.bookmarkVerse);

//exporting the routes to be integrated into the index.js
module.exports = router;
