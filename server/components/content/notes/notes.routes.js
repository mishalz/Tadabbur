import express from "express";
const router = express.Router();
import notesController from "./notes.controller.js";

//all routes relating to notes
router.get("/", notesController.getAllUserNotes);
router.delete("/", notesController.deleteNotes);
router.post("/:verse_key", notesController.addNewNote);
router.get("/:verse_key", notesController.getNotesForAVerse);
router.put("/:note_id", notesController.editNote);

//exporting the routes to be integrated into the index.js
export default router;
