import express from "express";
const router = express.Router();

import connectionsRoutes from "./connections/connections.routes.js";
import bookmarkRoutes from "./bookmarks/bookmarks.routes.js";
import extractUserSub from "./middleware/extractUserSub.js";

// Apply middleware to all connections routes
router.use(extractUserSub);
//forwarding all routes relating to contents (notes, themes, connections and bookmark) to their specific sub directories

router.use("/connections", connectionsRoutes);
router.use("/bookmarks", bookmarkRoutes);

//exporting the routes to be integrated into the index.js
export default router;
