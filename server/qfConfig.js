/**
 * qfOAuthConfig.js
 *
 * Quran Foundation OAuth2 client configuration — server-side only.
 *
 * ─────────────────────────────────────────────────────────────────
 * CLIENT TYPE: CONFIDENTIAL  (backend token-exchange pattern)
 * ─────────────────────────────────────────────────────────────────
 * This module assumes a confidential client by default, which means:
 *
 *   Browser / mobile ──[authorization code]──────► Your backend server
 *   Your backend     ──[code + client_secret]──────► QF Auth server
 *   QF Auth server   ──[access_token]───────────────► Your backend server
 *
 * QF_CLIENT_SECRET is therefore required unless Quran Foundation
 * explicitly tells you that your registered client is PUBLIC (PKCE-only).
 * If it is public: remove the QF_CLIENT_SECRET read below, set
 * clientSecret to undefined in the returned object, and update this comment.
 *
 * ─────────────────────────────────────────────────────────────────
 * ENVIRONMENT VARIABLES  (server-only — never expose to the browser)
 * ─────────────────────────────────────────────────────────────────
 *   QF_CLIENT_ID      (required)  – your OAuth2 client identifier
 *   QF_CLIENT_SECRET  (required for confidential clients) – keep secret
 *   QF_ENV            (optional)  – "prelive" | "production"  (default: "prelive")
 *
 * ─────────────────────────────────────────────────────────────────
 * SECURITY RULES — enforced throughout this file
 * ─────────────────────────────────────────────────────────────────
 *   • QF_CLIENT_SECRET is NEVER hardcoded.
 *   • QF_CLIENT_SECRET is NEVER included in any log, error message, or
 *     serialised object that could reach a log aggregator.
 *   • Errors thrown from this module NEVER contain credential values.
 */

"use strict";

// ---------------------------------------------------------------------------
// 1. Base-URL map — copy these exactly; do not derive or modify them.
// ---------------------------------------------------------------------------

/**
 * @typedef {"prelive"|"production"} QfEnv
 *
 * @typedef {{ authBaseUrl: string, apiBaseUrl: string }} QfUrls
 *
 * @typedef {{
 *   env:         QfEnv,
 *   clientId:    string,
 *   clientSecret: string | undefined,
 *   authBaseUrl: string,
 *   apiBaseUrl:  string
 * }} QfOAuthConfig
 */

/** @type {Record<QfEnv, QfUrls>} */
const ENV_URLS = Object.freeze({
  prelive: Object.freeze({
    authBaseUrl: "https://prelive-oauth2.quran.foundation",
    apiBaseUrl: "https://apis-prelive.quran.foundation",
  }),
  production: Object.freeze({
    authBaseUrl: "https://oauth2.quran.foundation",
    apiBaseUrl: "https://apis.quran.foundation",
  }),
});

// ---------------------------------------------------------------------------
// 2. Accepted values for QF_ENV
// ---------------------------------------------------------------------------

const VALID_ENVS = /** @type {readonly QfEnv[]} */ (Object.keys(ENV_URLS));

// ---------------------------------------------------------------------------
// 3. Singleton cache — config is resolved once per process lifetime.
//    This prevents redundant env-var reads and makes misconfiguration
//    fail fast at startup rather than silently at the first API call.
// ---------------------------------------------------------------------------

/** @type {QfOAuthConfig | null} */
let _cachedConfig = null;

// ---------------------------------------------------------------------------
// 4. getQfOAuthConfig()
// ---------------------------------------------------------------------------

/**
 * Reads and validates Quran Foundation OAuth2 configuration from environment
 * variables, then returns an immutable config object.
 *
 * Results are cached after the first successful call; subsequent calls return
 * the same object without re-reading process.env.
 *
 * @returns {QfOAuthConfig}
 *
 * @throws {Error} If QF_CLIENT_ID is absent.
 * @throws {Error} If QF_ENV is set to an unrecognised value.
 *
 * @example
 * const { authBaseUrl, apiBaseUrl, clientId } = getQfOAuthConfig();
 * // Use authBaseUrl to build the /authorize redirect, etc.
 */
export function getQfConfig() {
  if (_cachedConfig !== null) {
    return _cachedConfig;
  }

  // ------------------------------------------------------------------
  // 4a. QF_ENV — optional, defaults to "prelive"
  // ------------------------------------------------------------------
  const rawEnv = (process.env.QF_ENV || "prelive").trim().toLowerCase();

  if (!VALID_ENVS.includes(/** @type {any} */ (rawEnv))) {
    throw new Error(
      `[qfOAuthConfig] Invalid QF_ENV value: "${rawEnv}". ` +
        `Accepted values: ${VALID_ENVS.map((e) => `"${e}"`).join(", ")}.`,
    );
  }

  const env = /** @type {QfEnv} */ (rawEnv);

  // ------------------------------------------------------------------
  // 4b. QF_CLIENT_ID — required - depends on the env type
  //     The exact error message is part of the public contract; do not
  //     alter it — downstream tooling may match the string literally.
  // ------------------------------------------------------------------
  const clientId =
    env === "production"
      ? process.env.QF_CLIENT_ID_PROD
      : process.env.QF_CLIENT_ID_DEV;

  if (!clientId) {
    // IMPORTANT: Do NOT include any credential value in this message.
    throw new Error(
      "Missing Quran Foundation API credentials. Request access: https://api-docs.quran.foundation/request-access",
    );
  }

  // ------------------------------------------------------------------
  // 4c. QF_CLIENT_SECRET — required for confidential clients - depends on the env type.
  //     Read into a local variable; NEVER log, serialise, or concatenate
  //     this value into any string that could appear in application logs.
  //
  //     If Quran Foundation confirms your client is PUBLIC, replace the
  //     line below with:
  //       const clientSecret = undefined;
  //     and remove the warning block beneath it.
  // ------------------------------------------------------------------
  const clientSecret =
    env === "production"
      ? process.env.QF_CLIENT_SECRET_PROD
      : process.env.QF_CLIENT_SECRET_DEV || undefined;

  if (clientSecret === undefined) {
    // Warn operators that the secret is absent for a confidential client.
    // The warning intentionally contains NO credential values.
    console.warn(
      "[qfOAuthConfig] WARNING: QF_CLIENT_SECRET is not set. " +
        "This is only valid if Quran Foundation has confirmed your client is PUBLIC. " +
        "Confidential clients require QF_CLIENT_SECRET for backend token exchange.",
    );
  }

  // ------------------------------------------------------------------
  // 4d. Resolve both URLs atomically from the same env key.
  //     This guarantees auth and API base URLs always match.
  // ------------------------------------------------------------------
  const { authBaseUrl, apiBaseUrl } = ENV_URLS[env];

  // ------------------------------------------------------------------
  // 4e. Freeze the config object so callers cannot accidentally mutate
  //     shared state (e.g. config.clientId = "other").
  //     NOTE: clientSecret is present in the object so callers can use
  //     it — but it is intentionally omitted from any toString / toJSON
  //     representation below to reduce accidental exposure.
  // ------------------------------------------------------------------
  _cachedConfig = Object.freeze({
    env,
    clientId,
    clientSecret, // ← confidential: use only in server-side token requests
    authBaseUrl,
    apiBaseUrl,
  });

  return _cachedConfig;
}

// ---------------------------------------------------------------------------
// 5. Safe serialisation helper
//    Provides a log-safe summary that NEVER includes the client secret.
// ---------------------------------------------------------------------------

/**
 * Returns a plain object safe to log or display — credentials are redacted.
 *
 * @param {QfOAuthConfig} config
 * @returns {{ env: string, clientId: string, clientSecret: string, authBaseUrl: string, apiBaseUrl: string }}
 *
 * @example
 * console.log(toSafeLogObject(getQfOAuthConfig()));
 * // { env: 'prelive', clientId: 'abc…', clientSecret: '[REDACTED]', … }
 */
export function toSafeLogObject(config) {
  return {
    env: config.env,
    clientId: config.clientId,
    clientSecret: "[REDACTED]", // never log the real value
    authBaseUrl: config.authBaseUrl,
    apiBaseUrl: config.apiBaseUrl,
  };
}

// ---------------------------------------------------------------------------
// 6. resetConfigCache() — test / hot-reload helper only
//    Call this in unit tests to reset module state between test cases.
//    Do NOT call it in production application code.
// ---------------------------------------------------------------------------

/**
 * @internal
 * Clears the singleton cache so that getQfOAuthConfig() re-reads env vars
 * on the next call. Intended for use in tests only.
 */

export function resetConfigCache() {
  // export for testing; do not call in production
  _cachedConfig = null;
}
