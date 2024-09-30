const express = require("express");
const router = express.Router();
const notesController = require("./notes.controller");

//all routes relating to notes
router.get("/", notesController.getAllUserNotes);
router.get("/:verse_key", notesController.getNotesForAVerse);
router.post("/", notesController.addNewNote);
router.put("/:note_id", notesController.editNote);
router.delete("/", notesController.deleteNotes);

//exporting the routes to be integrated into the index.js
module.exports = router;
