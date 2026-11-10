/**
 * Build a URL for the backend API.
 *
 * VITE_API_URL is empty in normal use: the browser calls relative "/api/..."
 * URLs, which the dev server (vite.config.js) and the production host
 * (public/_redirects) proxy to the backend, keeping the session cookie
 * first-party. Set it only to point the client at a differently-hosted API.
 */
const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";

export const apiUrl = (path) => `${API_BASE_URL}${path}`;
