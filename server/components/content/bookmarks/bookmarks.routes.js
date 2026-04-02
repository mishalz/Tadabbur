import express from "express";
const router = express.Router();
import { getAllBookmarks, bookmarkVerse } from "./bookmarks.controller.js";

//all routes relating to bookmarks
router.get("/", getAllBookmarks);
router.post("/", bookmarkVerse);

//exporting the routes to be integrated into the index.js
export default router;
