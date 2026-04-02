import express from "express";
const router = express.Router();

import notesRoutes from "./notes/notes.routes.js";
import themesRoutes from "./themes/themes.routes.js";
import bookmarkRoutes from "./bookmarks/bookmarks.routes.js";
import connectionsRoutes from "./connections/connections.routes.js";

//forwarding all routes relating to contents (notes, themes, connections and bookmark) to their specific sub directories
router.use("/notes", notesRoutes);
router.use("/themes", themesRoutes);
router.use("/connections", connectionsRoutes);
router.use("/bookmarks", bookmarkRoutes);

//exporting the routes to be integrated into the index.js
export default router;
