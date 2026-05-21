import axios from "axios";
import { getQfConfig } from "../../../qfConfig.js";

/**
 * Proxy User API endpoints through the backend
 * This allows the client to call User APIs with the backend's credentials for auth
 */

/**
 * Create axios client for making User API calls
 * Automatically includes required headers for QF User APIs
 */
function createQfUserApiClient(accessToken) {
  if (!accessToken) {
    throw new Error("Access token is required for User API calls");
  }

  const { clientId, apiBaseUrl } = getQfConfig();

  return axios.create({
    baseURL: apiBaseUrl,
    headers: {
      "x-auth-token": accessToken,
      "x-client-id": clientId,
      "Content-Type": "application/json",
    },
  });
}

/**
 * Generic proxy handler for GET requests to User APIs
 * POST /api/content/user-api/get/:path
 */
export const getProxyHandler = async (req, res) => {
  try {
    const { path } = req.params;
    const accessToken = req.session.accessToken;

    if (!accessToken) {
      return res.status(401).json({
        error: "Access token not available. Please login again.",
      });
    }

    const client = createQfUserApiClient(accessToken);
    const queryString = new URLSearchParams(req.query).toString();
    const response = await client.get(
      `/auth/v1/${path}${queryString ? "?" + queryString : ""}`,
    );

    res.json(response.data);
  } catch (error) {
    console.error("User API GET error:", error.response?.data || error.message);
    const status = error.response?.status || 500;
    const errorData = error.response?.data || { error: error.message };
    res.status(status).json(errorData);
  }
};

/**
 * Generic proxy handler for POST requests to User APIs
 * POST /api/content/user-api/post/:path
 */
export const postProxyHandler = async (req, res) => {
  try {
    const { path } = req.params;
    const accessToken = req.session.accessToken;

    if (!accessToken) {
      return res.status(401).json({
        error: "Access token not available. Please login again.",
      });
    }

    const client = createQfUserApiClient(accessToken);
    const response = await client.post(`/auth/v1/${path}`, req.body);

    res.json(response.data);
  } catch (error) {
    console.error(
      "User API POST error:",
      error.response?.data || error.message,
    );
    const status = error.response?.status || 500;
    const errorData = error.response?.data || { error: error.message };
    res.status(status).json(errorData);
  }
};

/**
 * Generic proxy handler for PATCH requests to User APIs
 * PATCH /api/content/user-api/patch/:path
 */
export const patchProxyHandler = async (req, res) => {
  try {
    const { path } = req.params;
    const accessToken = req.session.accessToken;

    if (!accessToken) {
      return res.status(401).json({
        error: "Access token not available. Please login again.",
      });
    }

    const client = createQfUserApiClient(accessToken);
    const response = await client.patch(`/auth/v1/${path}`, req.body);

    res.json(response.data);
  } catch (error) {
    console.error(
      "User API PATCH error:",
      error.response?.data || error.message,
    );
    const status = error.response?.status || 500;
    const errorData = error.response?.data || { error: error.message };
    res.status(status).json(errorData);
  }
};

/**
 * Generic proxy handler for DELETE requests to User APIs
 * DELETE /api/content/user-api/delete/:path
 */
export const deleteProxyHandler = async (req, res) => {
  try {
    const { path } = req.params;
    const accessToken = req.session.accessToken;

    if (!accessToken) {
      return res.status(401).json({
        error: "Access token not available. Please login again.",
      });
    }

    const client = createQfUserApiClient(accessToken);
    const response = await client.delete(`/auth/v1/${path}`);

    res.json(response.data);
  } catch (error) {
    console.error(
      "User API DELETE error:",
      error.response?.data || error.message,
    );
    const status = error.response?.status || 500;
    const errorData = error.response?.data || { error: error.message };
    res.status(status).json(errorData);
  }
};

// Specific handlers for common endpoints

/**
 * GET /api/content/bookmarks
 * Get user's bookmarks
 */
export const getBookmarks = async (req, res) => {
  try {
    const accessToken = req.session.accessToken;

    if (!accessToken) {
      return res.status(401).json({
        error: "Access token not available. Please login again.",
      });
    }

    const client = createQfUserApiClient(accessToken);
    const response = await client.get("/auth/v1/bookmarks", {
      params: req.query,
    });

    res.json(response.data);
  } catch (error) {
    console.error(
      "Get bookmarks error:",
      error.response?.data || error.message,
    );
    const status = error.response?.status || 500;
    const errorData = error.response?.data || { error: error.message };
    res.status(status).json(errorData);
  }
};

/**
 * GET /api/content/collections
 * Get user's collections
 */
export const getCollections = async (req, res) => {
  try {
    const accessToken = req.session.accessToken;

    if (!accessToken) {
      return res.status(401).json({
        error: "Access token not available. Please login again.",
      });
    }

    const client = createQfUserApiClient(accessToken);
    const response = await client.get("/auth/v1/collections", {
      params: req.query,
    });

    res.json(response.data);
  } catch (error) {
    console.error(
      "Get collections error:",
      error.response?.data || error.message,
    );
    const status = error.response?.status || 500;
    const errorData = error.response?.data || { error: error.message };
    res.status(status).json(errorData);
  }
};

/**
 * GET /api/content/reading-sessions
 * Get user's reading sessions
 */
export const getReadingSessions = async (req, res) => {
  try {
    const accessToken = req.session.accessToken;

    if (!accessToken) {
      return res.status(401).json({
        error: "Access token not available. Please login again.",
      });
    }

    const client = createQfUserApiClient(accessToken);
    const response = await client.get("/auth/v1/reading-sessions", {
      params: req.query,
    });

    res.json(response.data);
  } catch (error) {
    console.error(
      "Get reading sessions error:",
      error.response?.data || error.message,
    );
    const status = error.response?.status || 500;
    const errorData = error.response?.data || { error: error.message };
    res.status(status).json(errorData);
  }
};

/**
 * GET /api/content/preferences
 * Get user's preferences
 */
export const getPreferences = async (req, res) => {
  try {
    const accessToken = req.session.accessToken;

    if (!accessToken) {
      return res.status(401).json({
        error: "Access token not available. Please login again.",
      });
    }

    const client = createQfUserApiClient(accessToken);
    const response = await client.get("/auth/v1/preferences");

    res.json(response.data);
  } catch (error) {
    console.error(
      "Get preferences error:",
      error.response?.data || error.message,
    );
    const status = error.response?.status || 500;
    const errorData = error.response?.data || { error: error.message };
    res.status(status).json(errorData);
  }
};

/**
 * PATCH /api/content/preferences
 * Update user's preferences
 */
export const updatePreferences = async (req, res) => {
  try {
    const accessToken = req.session.accessToken;

    if (!accessToken) {
      return res.status(401).json({
        error: "Access token not available. Please login again.",
      });
    }

    const client = createQfUserApiClient(accessToken);
    const response = await client.patch("/auth/v1/preferences", req.body);

    res.json(response.data);
  } catch (error) {
    console.error(
      "Update preferences error:",
      error.response?.data || error.message,
    );
    const status = error.response?.status || 500;
    const errorData = error.response?.data || { error: error.message };
    res.status(status).json(errorData);
  }
};
