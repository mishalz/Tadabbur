const express = require("express");
const router = express.Router();
const connectContoller = require("./connections.controller");

//all routes relating to connections
router.get("/", connectContoller.getAllUserConnections);
router.post("/", connectContoller.createConnection);
router.get("/:verse_key", connectContoller.getVerseConnections);

//exporting the routes to be integrated into the index.js
module.exports = router;
