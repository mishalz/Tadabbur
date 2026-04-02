//database configuration for the notes, themes and bookmarks
import mongoose from "mongoose";
const dbURL = process.env.CONTENT_DB_URL;

//connecting to the mongoDB using mongoose
const contentDBConnection = mongoose.createConnection(dbURL);

contentDBConnection.on("connected", () => {
  console.log("Successfully connected to the content database.");
});
contentDBConnection.on("error", (err) => {
  console.error("Failed to connect to content database.", err);
});

export default contentDBConnection;
