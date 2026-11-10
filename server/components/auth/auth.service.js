import axios from "axios";

import { getQfConfig } from "../../qfConfig.js";
import crypto from "crypto";

/**
 * Generate PKCE code_verifier / code_challenge pair
 * @returns {{ codeVerifier: string, codeChallenge: string, codeChallengeMethod: "S256" }}
 */
export function generatePkcePairLocal() {
  const codeVerifier = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(codeVerifier).digest();
  const codeChallenge = Buffer.from(hash)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  return {
    codeVerifier,
    codeChallenge,
    codeChallengeMethod: "S256",
  };
}

/**
 * Generate cryptographically random OAuth2 state value (CSRF protection)
 * @param {number} bytes - Number of random bytes (default 32)
 * @returns {string}
 */
export function generateState(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}

/**
 * Generate cryptographically random OIDC nonce value
 * @param {number} bytes - Number of random bytes (default 32)
 * @returns {string}
 */
export function generateNonce(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}

/**
 * Build the Quran Foundation OAuth2 Authorization URL with PKCE
 * Store state, nonce, and codeVerifier in a server session BEFORE redirecting
 * @param {Object} params
 * @param {string} params.redirectUri - Must match registered URI exactly
 * @param {string} params.scope - Space-separated list of scopes
 * @returns {{ url: string, state: string, nonce: string, codeVerifier: string }}
 */
export function buildAuthorizationUrl({
  redirectUri,
  scope = "openid offline_access user",
}) {
  const { authBaseUrl, clientId } = getQfConfig();
  const { codeVerifier, codeChallenge, codeChallengeMethod } =
    generatePkcePairLocal();

  const state = generateState();
  const nonce = generateNonce();

  const params = new URLSearchParams();
  params.set("response_type", "code");
  params.set("client_id", clientId);
  params.set("redirect_uri", redirectUri);
  params.set("scope", scope);
  params.set("state", state);
  params.set("nonce", nonce);
  params.set("code_challenge", codeChallenge);
  params.set("code_challenge_method", codeChallengeMethod);

  const url = `${authBaseUrl}/oauth2/auth?${params.toString()}`;

  return {
    url,
    state,
    nonce,
    codeVerifier,
  };
}

/**
 * Validate the state parameter from the OAuth2 callback (CSRF protection)
 * @param {string} returnedState - State returned from OAuth2 callback
 * @param {string} storedState - State stored in server session before redirect
 * @returns {boolean}
 */
export function validateState(returnedState, storedState) {
  if (!returnedState || !storedState) {
    return false;
  }
  return returnedState === storedState;
}

/**
 * Decode a JWT's payload WITHOUT verifying its signature.
 *
 * Acceptable here because the ID token is received directly from the Quran
 * Foundation token endpoint over TLS (OpenID Connect allows skipping signature
 * validation in that case); it is only used for the nonce check and profile
 * claims. Never use this for tokens that arrive from the browser.
 *
 * (Replaces jsonwebtoken, whose dependency buffer-equal-constant-time crashes
 * on newer Node versions because it needs the removed SlowBuffer API.)
 *
 * @param {string} token
 * @returns {object|null} The payload claims, or null if the token is malformed
 */
export function decodeJwtPayload(token) {
  if (typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    return payload !== null && typeof payload === "object" && !Array.isArray(payload)
      ? payload
      : null;
  } catch {
    return null;
  }
}

/**
 * Validate the nonce claim in the ID token (OIDC nonce validation)
 * @param {string} idToken - JWT ID token from token exchange
 * @param {string} storedNonce - Nonce stored in server session before redirect
 * @returns {boolean}
 */
export function validateNonce(idToken, storedNonce) {
  if (!idToken || !storedNonce) {
    return false;
  }

  return decodeJwtPayload(idToken)?.nonce === storedNonce;
}

/**
 * Extract user claims from the ID token
 * @param {string} idToken - JWT ID token
 * @returns {object} Decoded token claims (sub, email, name, etc.)
 */
export function extractUserFromIdToken(idToken) {
  if (!idToken) {
    return null;
  }

  return decodeJwtPayload(idToken);
}

/**
 * Verify issued scopes match requested scopes
 * @param {string} issuedScopes - Space-separated scopes from token response
 * @param {string} requestedScopes - Space-separated scopes requested in auth URL
 * @returns {object} - { all: boolean, missing: string[] }
 */
export function verifyScopesGranted(issuedScopes, requestedScopes) {
  if (!issuedScopes) {
    return { all: false, missing: requestedScopes.split(" ") };
  }

  const issued = new Set(issuedScopes.split(" "));
  const requested = requestedScopes.split(" ");
  const missing = requested.filter((scope) => !issued.has(scope));

  return {
    all: missing.length === 0,
    missing,
  };
}

/**
 * Exchange a refresh token for a new access token (confidential client).
 * @param {string} refreshToken
 * @returns {Promise<object>} Raw token response (access_token, expires_in, ...)
 */
export async function refreshTokens(refreshToken) {
  const { authBaseUrl, clientId, clientSecret } = getQfConfig();

  const params = new URLSearchParams();
  params.append("grant_type", "refresh_token");
  params.append("refresh_token", refreshToken);

  const response = await axios.post(
    `${authBaseUrl}/oauth2/token`,
    params.toString(),
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      auth: { username: clientId, password: clientSecret },
    },
  );
  return response.data;
}

// Claims the browser is allowed to see. The full ID-token claim set stays in
// the server-side session; it includes values (nonce, auth_time, ...) the UI
// has no use for.
const PUBLIC_USER_FIELDS = [
  "sub",
  "email",
  "name",
  "given_name",
  "family_name",
  "first_name",
  "last_name",
];

/**
 * Reduce the session's user claims to what is safe and useful to send to the browser.
 * @param {object|null} user
 * @returns {object|null}
 */
export function toPublicUser(user) {
  if (!user) return null;
  return Object.fromEntries(
    PUBLIC_USER_FIELDS.filter((key) => user[key] !== undefined).map((key) => [
      key,
      user[key],
    ]),
  );
}
