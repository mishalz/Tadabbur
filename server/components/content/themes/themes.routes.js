const express = require("express");
const router = express.Router();

//all routes relating to themes
router.get("/home", (req, res) => {
  res.send("you can now create themes");
});

//exporting the routes to be integrated into the index.js
module.exports = router;
