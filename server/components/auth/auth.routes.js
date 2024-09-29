const express = require("express");
const router = express.Router();

//retrieving all route handler functions from the controller file
const authController = require("./auth.controller.js");

//all routes for auth
router.post("/register", authController.registerUser);
router.post("/login", authController.loginUser);
router.get("/validate", authController.validateToken);

//exporting the routes to be integrated into the index.js
module.exports = router;
