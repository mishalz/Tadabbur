const express = require("express");
const router = express.Router();
const themesController = require("./themes.controller");

//all routes relating to themes
router.get("/", themesController.getAllThemes);
router.delete("/", themesController.deleteThemes);
router.post("/", themesController.createTheme);
router.delete("/:theme_id/verses", themesController.removeVersesFromTheme);
router.post("/:theme_id/verses", themesController.addVerseToTheme);
router.get("/:theme_id/verses", themesController.getAllVersesForTheme);
router.get("/:verse_key", themesController.getAllThemesOfVerse);

//exporting the routes to be integrated into the index.js
module.exports = router;
