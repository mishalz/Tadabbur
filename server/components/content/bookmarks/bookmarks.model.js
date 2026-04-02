//define the bookmark relationship model
import contentDBConnection from "../content.db.js";
import mongoose from "mongoose";

const bookmarkSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    verseKey: { type: String, required: true },
    surahName: { type: String, required: true },
  },
  { timestamps: true },
);

const Bookmark = contentDBConnection.model("Bookmark", bookmarkSchema);
export default Bookmark;
