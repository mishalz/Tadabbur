import express from "express";
const router = express.Router();

//retrieving all route handler functions from the controller file
import {
  registerUser,
  loginUser,
  validateUserToken,
  exchangeQfToken,
} from "./auth.controller.js";

//all routes for auth
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/validate", validateUserToken);
router.post("/qf/exchange", exchangeQfToken);

//exporting the routes to be integrated into the index.js
export default router;
