import axios from "axios";
import { getQfConfig } from "../../qfConfig.js";

/**
 * Create axios client configured for Quran Foundation User APIs
 * Includes x-auth-token and x-client-id headers required by QF
 */
function createQfApiClient(accessToken) {
  if (!accessToken) {
    throw new Error("Access token is required for User API calls");
  }

  const { clientId, apiBaseUrl } = getQfConfig();

  return axios.create({
    baseURL: apiBaseUrl,
    headers: {
      "x-auth-token": accessToken,
      "x-client-id": clientId,
    },
  });
}

/**
 * Get user bookmarks
 * Endpoint: GET /auth/v1/bookmarks
 * Requires: bookmark scope
 */
export async function getBookmarks(accessToken, params = {}) {
  const client = createQfApiClient(accessToken);

  try {
    const response = await client.get("/auth/v1/bookmarks", { params });
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching bookmarks:",
      error.response?.data || error.message,
    );
    throw error;
  }
}

/**
 * Create a new bookmark
 * Endpoint: POST /auth/v1/bookmarks
 * Requires: bookmark scope
 */
export async function createBookmark(accessToken, bookmarkData) {
  const client = createQfApiClient(accessToken);

  try {
    const response = await client.post("/auth/v1/bookmarks", bookmarkData);
    return response.data;
  } catch (error) {
    console.error(
      "Error creating bookmark:",
      error.response?.data || error.message,
    );
    throw error;
  }
}

/**
 * Delete a bookmark
 * Endpoint: DELETE /auth/v1/bookmarks/{id}
 * Requires: bookmark scope
 */
export async function deleteBookmark(accessToken, bookmarkId) {
  const client = createQfApiClient(accessToken);

  try {
    const response = await client.delete(`/auth/v1/bookmarks/${bookmarkId}`);
    return response.data;
  } catch (error) {
    console.error(
      "Error deleting bookmark:",
      error.response?.data || error.message,
    );
    throw error;
  }
}

/**
 * Get user collections
 * Endpoint: GET /auth/v1/collections
 * Requires: collection scope
 */
export async function getCollections(accessToken, params = {}) {
  const client = createQfApiClient(accessToken);

  try {
    const response = await client.get("/auth/v1/collections", { params });
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching collections:",
      error.response?.data || error.message,
    );
    throw error;
  }
}

/**
 * Create a new collection
 * Endpoint: POST /auth/v1/collections
 * Requires: collection scope
 */
export async function createCollection(accessToken, collectionData) {
  const client = createQfApiClient(accessToken);

  try {
    const response = await client.post("/auth/v1/collections", collectionData);
    return response.data;
  } catch (error) {
    console.error(
      "Error creating collection:",
      error.response?.data || error.message,
    );
    throw error;
  }
}

/**
 * Update a collection
 * Endpoint: PATCH /auth/v1/collections/{id}
 * Requires: collection scope
 */
export async function updateCollection(
  accessToken,
  collectionId,
  collectionData,
) {
  const client = createQfApiClient(accessToken);

  try {
    const response = await client.patch(
      `/auth/v1/collections/${collectionId}`,
      collectionData,
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error updating collection:",
      error.response?.data || error.message,
    );
    throw error;
  }
}

/**
 * Delete a collection
 * Endpoint: DELETE /auth/v1/collections/{id}
 * Requires: collection scope
 */
export async function deleteCollection(accessToken, collectionId) {
  const client = createQfApiClient(accessToken);

  try {
    const response = await client.delete(
      `/auth/v1/collections/${collectionId}`,
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error deleting collection:",
      error.response?.data || error.message,
    );
    throw error;
  }
}

/**
 * Get reading sessions (user reading progress)
 * Endpoint: GET /auth/v1/reading-sessions
 * Requires: reading_session scope
 */
export async function getReadingSessions(accessToken, params = {}) {
  const client = createQfApiClient(accessToken);

  try {
    const response = await client.get("/auth/v1/reading-sessions", { params });
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching reading sessions:",
      error.response?.data || error.message,
    );
    throw error;
  }
}

/**
 * Create a reading session
 * Endpoint: POST /auth/v1/reading-sessions
 * Requires: reading_session scope
 */
export async function createReadingSession(accessToken, sessionData) {
  const client = createQfApiClient(accessToken);

  try {
    const response = await client.post(
      "/auth/v1/reading-sessions",
      sessionData,
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error creating reading session:",
      error.response?.data || error.message,
    );
    throw error;
  }
}

/**
 * Update a reading session
 * Endpoint: PATCH /auth/v1/reading-sessions/{id}
 * Requires: reading_session scope
 */
export async function updateReadingSession(
  accessToken,
  sessionId,
  sessionData,
) {
  const client = createQfApiClient(accessToken);

  try {
    const response = await client.patch(
      `/auth/v1/reading-sessions/${sessionId}`,
      sessionData,
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error updating reading session:",
      error.response?.data || error.message,
    );
    throw error;
  }
}

/**
 * Get user preferences
 * Endpoint: GET /auth/v1/preferences
 * Requires: preference scope
 */
export async function getPreferences(accessToken) {
  const client = createQfApiClient(accessToken);

  try {
    const response = await client.get("/auth/v1/preferences");
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching preferences:",
      error.response?.data || error.message,
    );
    throw error;
  }
}

/**
 * Update user preferences
 * Endpoint: PATCH /auth/v1/preferences
 * Requires: preference scope
 */
export async function updatePreferences(accessToken, preferencesData) {
  const client = createQfApiClient(accessToken);

  try {
    const response = await client.patch(
      "/auth/v1/preferences",
      preferencesData,
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error updating preferences:",
      error.response?.data || error.message,
    );
    throw error;
  }
}

/**
 * Get reading goals
 * Endpoint: GET /auth/v1/goals
 * Requires: goal scope
 */
export async function getGoals(accessToken) {
  const client = createQfApiClient(accessToken);

  try {
    const response = await client.get("/auth/v1/goals");
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching goals:",
      error.response?.data || error.message,
    );
    throw error;
  }
}

/**
 * Create a reading goal
 * Endpoint: POST /auth/v1/goals
 * Requires: goal scope
 */
export async function createGoal(accessToken, goalData) {
  const client = createQfApiClient(accessToken);

  try {
    const response = await client.post("/auth/v1/goals", goalData);
    return response.data;
  } catch (error) {
    console.error(
      "Error creating goal:",
      error.response?.data || error.message,
    );
    throw error;
  }
}

/**
 * Get reading streaks
 * Endpoint: GET /auth/v1/streaks
 * Requires: streak scope
 */
export async function getStreaks(accessToken) {
  const client = createQfApiClient(accessToken);

  try {
    const response = await client.get("/auth/v1/streaks");
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching streaks:",
      error.response?.data || error.message,
    );
    throw error;
  }
}
