const express = require("express");
const router = express.Router();

//all routes relating to notes
router.get("/home", (req, res) => {
  res.send("you can now create notres");
});

//exporting the routes to be integrated into the index.js
module.exports = router;
