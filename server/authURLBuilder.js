const crypto = require("crypto");
import {getQfOAuthConfig} from "./qfOAuthConfig";
import { generatePkcePair } from "./pkceConfig";

function randomString(bytes = 16) {
  return crypto.randomBytes(bytes).toString("hex");
}

/**
 * Store { state, nonce, codeVerifier, redirectUri } in a server session
 * BEFORE redirecting, then validate state on callback and use codeVerifier
 * in the token exchange.
 */
export function buildAuthorizationUrl({
  redirectUri,
  scope = "openid offline_access user collection",
}) {
  const { authBaseUrl, clientId } = getQfOAuthConfig();
  const { codeVerifier, codeChallenge } = generatePkcePair();

  const state = randomString(16);
  const nonce = randomString(16);

  const params = new URLSearchParams();
  params.set("response_type", "code");
  params.set("client_id", clientId);
  params.set("redirect_uri", redirectUri);
  params.set("scope", scope);
  params.set("state", state);
  params.set("nonce", nonce);
  params.set("code_challenge", codeChallenge);
  params.set("code_challenge_method", "S256");

  const url = `${authBaseUrl}/oauth2/auth?${params.toString()}`;

  return {
    url,
    // persist these server-side (session or secure httpOnly cookie)
    pkce: { state, nonce, codeVerifier },
  };
}

