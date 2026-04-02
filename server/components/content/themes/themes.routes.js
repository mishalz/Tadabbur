import express from "express";
const router = express.Router();
import themesController from "./themes.controller.js";

//all routes relating to themes
router.get("/", themesController.getAllThemes);
router.delete("/", themesController.deleteThemes);
router.post("/", themesController.createTheme);
router.delete("/:theme_id/verses", themesController.removeVersesFromTheme);
router.post("/:theme_id/verses", themesController.addVerseToTheme);
router.get("/:theme_id/verses", themesController.getAllVersesForTheme);
router.get("/:verse_key", themesController.getAllThemesOfVerse);

//exporting the routes to be integrated into the index.js
export default router;
