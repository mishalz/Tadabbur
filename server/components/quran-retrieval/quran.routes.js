import express from "express";
const router = express.Router();
import {
  getAllSurahs,
  getSurahData,
  getVerseDataRouteHandler,
} from "./quran.controller.js";

router.get("/surahs", getAllSurahs);
router.get("/surahs/:id", getSurahData);
router.get("/verses/:verse_key", getVerseDataRouteHandler);

//exporting the routes to be integrated into the index.js
export default router;
