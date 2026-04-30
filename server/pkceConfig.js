/**
 * pkce.js
 *
 * PKCE (Proof Key for Code Exchange) and security-parameter helpers.
 *
 * These functions are used CLIENT-SIDE (browser or native app) to generate
 * the code_verifier / code_challenge pair, the OAuth2 state, and the OIDC
 * nonce before the user is redirected to the Quran Foundation login page.
 *
 * All values are cryptographically random; none of them are secrets that
 * need to be kept permanently, but code_verifier must be persisted until
 * the callback so it can be forwarded to the backend token-exchange endpoint.
 *
 * References
 * ----------
 *   Auth URL params : https://api-docs.quran.foundation/docs/tutorials/oidc/getting-started-with-oauth2#step-2-build-authorization-url-with-pkce
 *   OIDC nonce      : https://api-docs.quran.foundation/docs/tutorials/oidc/openid-connect
 */

"use strict";
import crypto from "crypto";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Encode a Buffer as Base64URL (RFC 4648 §5) — no padding, URL-safe chars.
 *
 * @param {Buffer} buf
 * @returns {string}
 */
function base64url(buf) {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate a PKCE code_verifier / code_challenge pair.
 *
 * code_verifier  — cryptographically random string; persist until callback.
 * code_challenge — BASE64URL(SHA-256(code_verifier)); sent in /oauth2/auth.
 *
 * The challenge method is always "S256" as required by the QF authorization
 * server (plain is not accepted).
 *
 * @returns {{ codeVerifier: string, codeChallenge: string, codeChallengeMethod: "S256" }}
 */
export function generatePkcePair() {
  const codeVerifier  = base64url(crypto.randomBytes(32));
  const hash          = crypto.createHash("sha256").update(codeVerifier).digest();
  const codeChallenge = base64url(hash);

  return {
    codeVerifier,           // keep server-side until /oauth2/token exchange
    codeChallenge,          // send as code_challenge in /oauth2/auth
    codeChallengeMethod: "S256",
  };
}

/**
 * Generate a cryptographically random OAuth2 state value.
 *
 * state is used for CSRF protection: store before redirect, then validate
 * that the callback returns exactly the same value before trusting the code.
 *
 * @param {number} [bytes=32]
 * @returns {string}
 */
export function generateState(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}

/**
 * Generate a cryptographically random OIDC nonce.
 *
 * nonce is sent in /oauth2/auth when the openid scope is requested.
 * After token exchange, verify that the id_token's `nonce` claim equals
 * this value before trusting the id_token.
 *
 * @param {number} [bytes=32]
 * @returns {string}
 */
export function generateNonce(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}

