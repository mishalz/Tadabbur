//define the mongoose schema for the themes resource
import contentDBConnection from "../content.db.js";
import mongoose from "mongoose";

//schema for the theme resource
const themeSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String },
    icon: { type: String, required: true },
    colour: { type: String, required: true },
  },
  { timestamps: true },
);

//schema to define the relationship between the verses and the themes
const themeVerseSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    verseKey: { type: String, required: true },
    themeId: { type: String, required: true },
    themeName: { type: String, required: true },
    arabicText: { type: String, required: true },
    translation: { type: String, required: true },
  },
  { timestamps: true },
);

//defining the indexes for both the schemas
//to ensure a composite key of (user id, theme name) so that a user can have only one theme with a particular name
themeSchema.index({ userId: 1, name: 1 }, { unique: true });
//to ensure a composite key of (theme id, verse key) so that a verse can not be added twice to a theme
themeVerseSchema.index({ verseKey: 1, themeId: 1 }, { unique: true });

//define the models for both the schema
export const Theme = contentDBConnection.model("Theme", themeSchema);
export const AddedToTheme = contentDBConnection.model(
  "AddedToTheme",
  themeVerseSchema,
);
