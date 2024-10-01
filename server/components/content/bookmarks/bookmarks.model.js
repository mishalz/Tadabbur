//define the bookmark relationship model
const contentDBConnection = require("../content.db");
const mongoose = require("mongoose");

const bookmarkSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    verseKey: { type: String, required: true },
    surahName: { type: String, required: true },
  },
  { timestamps: true }
);

const Bookmark = contentDBConnection.model("Bookmark", bookmarkSchema);

module.exports = Bookmark;
