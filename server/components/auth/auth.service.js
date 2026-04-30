import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { getQfConfig } from "../../qfConfig.js";
import crypto from "crypto";
import { generatePkcePair } from "../../pkceConfig.js";

//the secret key is used to sign and validate the jwt tokens
const secretKey = process.env.JWT_SECRET_KEY;

//To check if the user entered password matches the encrypted password stored in the database.
export const matchPassword = async (plainPassword, encryptedPassword) => {
  const result = await bcrypt.compare(plainPassword, encryptedPassword);
  return result;
};

//To generate a token if the user entered data in login process clears all checks.
export const generateToken = (user) => {
  //defining the information that will be stored in the token
  const payload = {
    id: user._id,
    username: user.username,
  };

  //to define the time that the token will expire in.
  const options = { expiresIn: "7d" };

  //generate and return the token
  const token = jwt.sign(payload, secretKey, options);
  return token;
};

function randomString(bytes = 16) {
  return crypto.randomBytes(bytes).toString("hex");
}

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
  const { codeVerifier, codeChallenge, codeChallengeMethod } = generatePkcePairLocal();

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
 * Validate the nonce claim in the ID token (OIDC nonce validation)
 * @param {string} idToken - JWT ID token from token exchange
 * @param {string} storedNonce - Nonce stored in server session before redirect
 * @returns {boolean}
 */
export function validateNonce(idToken, storedNonce) {
  if (!idToken || !storedNonce) {
    return false;
  }

  try {
    const decoded = jwt.decode(idToken);
    return decoded?.nonce === storedNonce;
  } catch (error) {
    console.error("Error decoding ID token for nonce validation:", error);
    return false;
  }
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

  try {
    const decoded = jwt.decode(idToken);
    return decoded;
  } catch (error) {
    console.error("Error decoding ID token:", error);
    return null;
  }
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
