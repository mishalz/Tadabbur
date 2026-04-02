/**
 * Quran Foundation API — Credential & Environment Configuration
 *
 * Server-only module. Never import this on the client side.
 *
 * Required environment variables:
 *   QF_CLIENT_ID      — Your Quran Foundation client ID
 *   QF_CLIENT_SECRET  — Your Quran Foundation client secret
 *   QF_ENV            — (optional) "prelive" | "production"  (default: "prelive")
 */

import "dotenv/config";
const ENV_URLS = {
  prelive: {
    authBaseUrl: "https://prelive-oauth2.quran.foundation",
    apiBaseUrl: "https://apis-prelive.quran.foundation",
  },
  production: {
    authBaseUrl: "https://oauth2.quran.foundation",
    apiBaseUrl: "https://apis.quran.foundation",
  },
};

const VALID_ENVS = Object.keys(ENV_URLS);

const MISSING_CREDENTIALS_ERROR =
  "Missing Quran Foundation API credentials. Request access: https://api-docs.quran.foundation/request-access";

/**
 * Returns the validated Quran Foundation configuration derived from
 * environment variables. Throws on any misconfiguration.
 *
 * @returns {{
 *   env: "prelive" | "production",
 *   clientId: string,
 *   clientSecret: string,
 *   authBaseUrl: string,
 *   apiBaseUrl: string,
 * }}
 */
export function getQfConfig() {
  const envType = process.env.QF_ENV;
  const clientId =
    envType === "production"
      ? process.env.QF_CLIENT_ID_PROD
      : process.env.QF_CLIENT_ID_DEV;
  const clientSecret =
    envType === "production"
      ? process.env.QF_CLIENT_SECRET_PROD
      : process.env.QF_CLIENT_SECRET_DEV;

  // Throw a single, safe message — never leak which value is missing so that
  // the error itself cannot be used to probe credential presence.
  if (!clientId || !clientSecret) {
    throw new Error(MISSING_CREDENTIALS_ERROR);
  }

  if (!VALID_ENVS.includes(envType)) {
    throw new Error(
      `Invalid QF_ENV value "${envType}". Must be one of: ${VALID_ENVS.join(", ")}.`,
    );
  }

  const { authBaseUrl, apiBaseUrl } = ENV_URLS[envType];

  return {
    env: envType,
    clientId,
    clientSecret,
    authBaseUrl,
    apiBaseUrl,
  };
}
