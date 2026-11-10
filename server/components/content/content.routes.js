import express from "express";
const router = express.Router();

import connectionsRoutes from "./connections/connections.routes.js";
import bookmarkRoutes from "./bookmarks/bookmarks.routes.js";
import requireAuth from "../../middleware/requireAuth.js";

// Every content route needs a logged-in session
router.use(requireAuth);
//forwarding all routes relating to contents (connections and bookmarks) to their specific sub directories

router.use("/connections", connectionsRoutes);
router.use("/bookmarks", bookmarkRoutes);

//exporting the routes to be integrated into the index.js
export default router;
