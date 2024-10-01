//define the notes model
const contentDBConnection = require("../content.db");
const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    verseKey: { type: String, required: true },
    heading: { type: String, required: true },
    content: { type: String, required: true },
    colour: { type: String, required: true },
  },
  { timestamps: true }
);

const Note = contentDBConnection.model("Note", noteSchema);

module.exports = Note;
