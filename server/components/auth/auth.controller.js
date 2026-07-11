import axios from "axios";
import jwt from "jsonwebtoken";
import {
  buildAuthorizationUrl,
  validateState,
  validateNonce,
  extractUserFromIdToken,
  verifyScopesGranted,
} from "./auth.service.js";

import { getQfConfig } from "../../qfConfig.js";

/**
 * Handler: GET /api/auth/login
 *
 * STEP 1 OF OAUTH2 FLOW:
 * - Generates OAuth2 authorization URL with PKCE, state, and nonce
 * - Stores PKCE parameters in Redis session (via req.session with connect-redis)
 * - Returns redirect URL for client to use
 *
 * SESSION STORAGE (Redis):
 * - oauthState: CSRF protection value
 * - oauthNonce: OIDC nonce validation
 * - codeVerifier: PKCE code verifier (kept secret, sent to token endpoint)
 * - redirectUri: Must match registered URI exactly
 * - requestedScope: Scopes requested from OAuth provider
 *
 * BROWSER FLOW:
 * 1. Client calls GET /api/auth/login with credentials: true
 * 2. Server creates session cookie and stores PKCE/state/nonce in Redis
 * 3. Browser receives session cookie (SameSite=None for cross-origin)
 * 4. Server returns authUrl
 * 5. Client redirects browser to OAuth provider
 * 6. Browser is redirected back with code and state in URL
 */
export const loginHandler = async (req, res) => {
  try {
    const { authBaseUrl } = getQfConfig();

    // redirectUri must exactly match one of the URIs registered with QF
    const redirectUri = `${process.env.APP_BASE_URL}/callback`;

    // Scopes — add only what your app actually needs
    const scope = process.env.QF_SCOPE;

    const result = buildAuthorizationUrl({ redirectUri, scope });
    console.log("Generated authorization URL:", result.url);

    // MUST store PKCE parameters in session BEFORE redirecting
    // These will be validated in the callback and used in token exchange
    req.session.oauthState = result.state;
    req.session.oauthNonce = result.nonce;
    req.session.codeVerifier = result.codeVerifier;
    req.session.redirectUri = redirectUri;
    req.session.requestedScope = scope;

    // Save session before responding
    req.session.save((err) => {
      if (err) {
        return res.status(500).json({
          error: "Failed to initialize login session",
        });
      }

      // Debug: log session id and stored PKCE/state values
      try {
        console.log("[Auth][login] Session saved:", {
          sessionID: req.sessionID,
          oauthState: req.session.oauthState,
          oauthNonce: req.session.oauthNonce,
          codeVerifier: req.session.codeVerifier ? "[present]" : "[missing]",
          redirectUri: req.session.redirectUri,
          requestedScope: req.session.requestedScope,
        });
      } catch (e) {
        console.error("[Auth][login] Failed to log session info:", e);
      }

      // Return the authorization URL for the client to redirect to
      res.json({
        authUrl: result.url,
      });
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to initialize login",
      message: error.message,
    });
  }
};

/**
 * Handler: POST /api/auth/qf/exchange
 *
 * STEP 2 OF OAUTH2 FLOW:
 * - Client sends authorization code and state from OAuth provider callback
 * - Backend retrieves PKCE/state/nonce from Redis session (stored in Step 1)
 * - Exchanges authorization code for tokens using client_secret
 * - Returns access_token, refresh_token, id_token, and user info
 *
 * SESSION RETRIEVAL (Redis):
 * - Validates state parameter (CSRF protection)
 * - Retrieves codeVerifier (PKCE) from session
 * - Validates nonce in id_token (OIDC protection)
 * - Verifies scopes granted match requested scopes
 *
 * BROWSER FLOW:
 * 1. OAuth provider redirects: GET /callback?code=AUTH_CODE&state=STATE
 * 2. Client extracts code and state from URL
 * 3. Client calls POST /api/auth/qf/exchange with { code, state } and credentials: true
 * 4. Browser sends session cookie (contains PKCE/nonce/state from Step 1)
 * 5. Server retrieves values from Redis session
 * 6. Server validates state matches (CSRF protection)
 * 7. Server uses codeVerifier with authorization code to get tokens
 * 8. Server validates nonce in id_token (OIDC protection)
 * 9. Server returns tokens to client
 * 10. Client stores tokens in localStorage
 *
 * SECURITY:
 * - Authorization code is single-use and expires quickly
 * - PKCE codeVerifier never sent to browser or OAuth provider URL
 * - State prevents CSRF attacks
 * - Nonce prevents token replay attacks
 * - Session stored in Redis is secure and persistent
 */
export const exchangeQfToken = async (req, res) => {
  const { code, state } = req.body;
  const { authBaseUrl, clientId, clientSecret } = getQfConfig();

  // Debug: log incoming cookies and session snapshot for troubleshooting
  try {
    console.log("[Auth][exchange] Incoming request:", {
      cookies: req.headers.cookie || null,
      sessionID: req.sessionID || null,
      sessionSnapshot: {
        oauthState: req.session?.oauthState,
        oauthNonce: req.session?.oauthNonce,
        codeVerifier: req.session?.codeVerifier ? "[present]" : "[missing]",
        requestedScope: req.session?.requestedScope,
      },
    });
  } catch (e) {
    console.error("[Auth][exchange] Failed to log request info:", e);
  }

  try {
    // ─────────────────────────────────────────────────────────────────
    // 1. Validate state parameter (CSRF protection)
    // ─────────────────────────────────────────────────────────────────
    if (!validateState(state, req.session.oauthState)) {
      console.error("State validation failed - possible CSRF attack");
      console.log("Returned state:", state);
      console.log("Stored state:", req.session.oauthState);

      return res.status(403).json({
        error: "Invalid state parameter - CSRF validation failed",
      });
    }

    // ─────────────────────────────────────────────────────────────────
    // 2. Verify code and PKCE verifier are available
    // ─────────────────────────────────────────────────────────────────
    if (!code || !req.session.codeVerifier) {
      return res.status(400).json({
        error: "Missing authorization code or code verifier",
      });
    }

    const codeVerifier = req.session.codeVerifier;
    const redirectUri = req.session.redirectUri;
    const storedNonce = req.session.oauthNonce;

    // ─────────────────────────────────────────────────────────────────
    // 3. Exchange authorization code for tokens using confidential
    //    client authentication (HTTP Basic Auth with client_secret)
    // ─────────────────────────────────────────────────────────────────
    const params = new URLSearchParams();
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", redirectUri);
    params.append("code_verifier", codeVerifier);

    const tokenResponse = await axios.post(
      `${authBaseUrl}/oauth2/token`,
      params.toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        auth: {
          username: clientId,
          password: clientSecret,
        },
      },
    );

    const tokenData = tokenResponse.data;

    // ─────────────────────────────────────────────────────────────────
    // 4. Validate nonce in id_token (OIDC validation)
    // ─────────────────────────────────────────────────────────────────
    if (tokenData.id_token && !validateNonce(tokenData.id_token, storedNonce)) {
      console.error("Nonce validation failed - id_token nonce mismatch");
      return res.status(403).json({
        error: "Invalid nonce - id_token validation failed",
      });
    }

    // ─────────────────────────────────────────────────────────────────
    // 5. Extract user identity claims from id_token
    // ─────────────────────────────────────────────────────────────────
    const user = tokenData.id_token
      ? extractUserFromIdToken(tokenData.id_token)
      : null;

    // ─────────────────────────────────────────────────────────────────
    // 6. Verify granted scopes match requested scopes
    // ─────────────────────────────────────────────────────────────────
    const scopeVerification = verifyScopesGranted(
      tokenData.scope,
      req.session.requestedScope,
    );
    if (!scopeVerification.all) {
      console.warn(
        "Some requested scopes were not granted:",
        scopeVerification.missing,
      );
    }

    // ─────────────────────────────────────────────────────────────────
    // 7. Store tokens in session for use in subsequent requests
    // ─────────────────────────────────────────────────────────────────
    req.session.accessToken = tokenData.access_token;
    req.session.refreshToken = tokenData.refresh_token;
    req.session.idToken = tokenData.id_token;
    req.session.expiresIn = tokenData.expires_in;
    req.session.tokenExpiresAt = Date.now() + tokenData.expires_in * 1000;
    req.session.user = user;
    req.session.isLoggedIn = true;

    // Clear sensitive PKCE data from session after successful exchange
    delete req.session.oauthState;
    delete req.session.oauthNonce;
    delete req.session.codeVerifier;
    delete req.session.requestedScope;

    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).json({
          error: "Failed to store session",
        });
      }

      // ─────────────────────────────────────────────────────────────────
      // 8. Return tokens and user info to client
      // ─────────────────────────────────────────────────────────────────
      res.json({
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        idToken: tokenData.id_token,
        expiresIn: tokenData.expiresIn,
        tokenType: tokenData.token_type,
        scope: tokenData.scope,
        user,
        success: true,
      });
    });
  } catch (error) {
    console.error(
      "Token exchange error inside exchange token:",
      error.response?.data || error.message,
    );
    const errorData = error.response?.data;

    let errorMessage = "Failed to exchange authorization code";
    if (errorData?.error === "invalid_grant") {
      errorMessage =
        "Authorization code expired or already used. Please restart login.";
    } else if (errorData?.error === "invalid_client") {
      errorMessage = "Client authentication failed. Check client credentials.";
    } else if (errorData?.error === "redirect_uri_mismatch") {
      errorMessage = "Redirect URI mismatch. Contact support.";
    }

    res.status(401).json({
      error: errorMessage,
      errorCode: errorData?.error,
    });
  }
};

/**
 * Handler: POST /api/auth/refresh
 *
 * REFRESH TOKEN FLOW:
 * - Retrieves refresh_token from Redis session (stored during login exchange)
 * - Uses refresh_token to request new access_token from OAuth provider
 * - Updates tokens in Redis session
 * - Returns new access_token to client
 *
 * SESSION USAGE (Redis):
 * - Retrieves refreshToken from session
 * - Updates accessToken in session with new token
 * - Updates expiresIn and tokenExpiresAt in session
 *
 * BROWSER FLOW:
 * 1. Client gets 401 on /api/content/* request (access token expired)
 * 2. Client interceptor calls POST /api/auth/refresh with credentials: true
 * 3. Browser sends session cookie
 * 4. Server retrieves refreshToken from Redis session
 * 5. Server exchanges refreshToken for new accessToken with OAuth provider
 * 6. Server updates session with new tokens
 * 7. Server returns new accessToken
 * 8. Client retries original request with new accessToken
 */
export const refreshAccessToken = async (req, res) => {
  try {
    const { authBaseUrl, clientId, clientSecret } = getQfConfig();

    if (!req.session.refreshToken) {
      return res.status(401).json({
        error: "No refresh token available. Please login again.",
      });
    }

    const refreshToken = req.session.refreshToken;

    // Prepare token refresh request
    const params = new URLSearchParams();
    params.append("grant_type", "refresh_token");
    params.append("refresh_token", refreshToken);

    const tokenResponse = await axios.post(
      `${authBaseUrl}/oauth2/token`,
      params.toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        auth: {
          username: clientId,
          password: clientSecret,
        },
      },
    );

    const tokenData = tokenResponse.data;

    // Update session with new tokens
    req.session.accessToken = tokenData.access_token;
    if (tokenData.refresh_token) {
      req.session.refreshToken = tokenData.refresh_token;
    }
    req.session.expiresIn = tokenData.expires_in;
    req.session.tokenExpiresAt = Date.now() + tokenData.expires_in * 1000;

    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).json({
          error: "Failed to update session",
        });
      }

      res.json({
        accessToken: tokenData.access_token,
        expiresIn: tokenData.expires_in,
        tokenType: tokenData.token_type,
        success: true,
      });
    });
  } catch (error) {
    console.error(
      "Token refresh error:",
      error.response?.data || error.message,
    );
    const errorData = error.response?.data;

    let errorMessage = "Failed to refresh token";
    if (errorData?.error === "invalid_grant") {
      errorMessage = "Refresh token expired. Please login again.";
    }

    res.status(401).json({
      error: errorMessage,
      errorCode: errorData?.error,
    });
  }
};

/**
 * Handler: GET /api/auth/logout
 * Clear session and revoke tokens if possible
 */
export const logoutHandler = (req, res) => {
  try {
    const idToken = req.session.idToken;

    // Destroy session
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destruction error:", err);
        return res.status(500).json({
          error: "Failed to logout",
        });
      }

      // Return logout URL pointing to QF logout endpoint
      // Include post_logout_redirect_uri if it's registered with QF
      const { authBaseUrl } = getQfConfig();
      const logoutUrl = new URL(`${authBaseUrl}/oauth2/sessions/logout`);

      if (idToken) {
        logoutUrl.searchParams.append("id_token_hint", idToken);
      }

      if (process.env.POST_LOGOUT_REDIRECT_URI) {
        logoutUrl.searchParams.append(
          "post_logout_redirect_uri",
          process.env.POST_LOGOUT_REDIRECT_URI,
        );
      }

      res.json({
        success: true,
        logoutUrl: logoutUrl.toString(),
      });
    });
  } catch (error) {
    console.error("Logout handler error:", error);
    res.status(500).json({
      error: "Logout failed",
      message: error.message,
    });
  }
};

/**
 * Handler: GET /api/auth/me
 * Get current user info from session
 */
export const getCurrentUser = (req, res) => {
  try {
    if (!req.session.isLoggedIn || !req.session.user) {
      return res.status(401).json({
        error: "Not authenticated",
      });
    }

    res.json({
      user: req.session.user,
      accessToken: req.session.accessToken,
      success: true,
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({
      error: "Failed to get user info",
    });
  }
};
