const express = require("express");
const router = express.Router();

const quranController = require("./quran.controller");

router.get("/surahs", quranController.getAllSurahs);
router.get("/surahs/:id", quranController.getSurahData);
router.get("/verses/random", quranController.getRandomVerse);
router.get("/verses/:verse_key", quranController.getVerseData);

//exporting the routes to be integrated into the index.js
module.exports = router;
