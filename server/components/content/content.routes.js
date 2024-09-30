const express = require("express");
const router = express.Router();

const notesRoutes = require("./notes/notes.routes");
const themesRoutes = require("./themes/themes.routes");
const bookmarkRoutes = require("./bookmarks/bookmarks.routes");
const connectionsRoutes = require("./connections/connections.routes");

//forwarding all routes relating to contents (notes, themes, connections and bookmark) to their specific sub directories
router.use("/notes", notesRoutes);
router.use("/themes", themesRoutes);
router.use("/connections", connectionsRoutes);
router.use("/bookmarks", bookmarkRoutes);

//exporting the routes to be integrated into the index.js
module.exports = router;
