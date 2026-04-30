import express from "express";

const router = express.Router();

//retrieving all route handler functions from the controller file
import {
  loginHandler,
  exchangeQfToken,
  refreshAccessToken,
  logoutHandler,
  getCurrentUser,
} from "./auth.controller.js";

//all routes for auth

// OAuth2 flow endpoints
// Step 1: Client initiates login -> GET /api/auth/login
router.get("/login", loginHandler);

// Step 2: Client exchanges authorization code -> POST /api/auth/qf/exchange
router.post("/qf/exchange", exchangeQfToken);

// Token refresh -> POST /api/auth/refresh
router.post("/refresh", refreshAccessToken);

// Logout -> GET /api/auth/logout
router.get("/logout", logoutHandler);

// Get current user -> GET /api/auth/me
router.get("/me", getCurrentUser);

//exporting the routes to be integrated into the index.js
export default router;
