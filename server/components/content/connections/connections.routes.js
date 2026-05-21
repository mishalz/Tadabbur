import express from "express";
const router = express.Router();
import connectContoller from "./connections.controller.js";

//all routes relating to connections
router.post("/", connectContoller.createConnection);
router.get("/:verse_key/count", connectContoller.getVerseConnectionCount);
router.delete(
  "/:from_verse_key/:to_verse_key",
  connectContoller.deleteConnection,
);
router.get("/:verse_key", connectContoller.getAllVerseConnections);

///api/content/connections/${fromVerseKey}/${toVerseKey}

//exporting the routes to be integrated into the index.js
export default router;
