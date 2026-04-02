import express from "express";
const router = express.Router();
import connectContoller from "./connections.controller.js";

//all routes relating to connections
router.get("/", connectContoller.getAllUserConnections);
router.post("/", connectContoller.createConnection);
router.get("/:verse_key", connectContoller.getAllVerseConnections);

//exporting the routes to be integrated into the index.js
export default router;
