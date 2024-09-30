const express = require("express");
const router = express.Router();

//all routes relating to bookmarks
router.get("/home", (req, res) => {
  res.send("you can now add bookmarks");
});

//exporting the routes to be integrated into the index.js
module.exports = router;
