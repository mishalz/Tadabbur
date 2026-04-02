//define the notes model
import contentDBConnection from "../content.db.js";
import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    verseKey: { type: String, required: true },
    heading: { type: String, required: true },
    content: { type: String, required: true },
    colour: { type: String, required: true },
  },
  { timestamps: true },
);

const Note = contentDBConnection.model("Note", noteSchema);
export default Note;
