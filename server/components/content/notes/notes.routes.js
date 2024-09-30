const express = require("express");
const router = express.Router();
const notesController = require("./notes.controller");

//all routes relating to notes
router.get("/", notesController.getAllUserNotes);
router.delete("/", notesController.deleteNotes);
router.post("/:verse_key", notesController.addNewNote);
router.get("/:verse_key", notesController.getNotesForAVerse);
router.put("/:note_id", notesController.editNote);

//exporting the routes to be integrated into the index.js
module.exports = router;
