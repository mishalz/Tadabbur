import { refreshTokens } from "../../auth/auth.service.js";

// Refresh slightly early so a token never expires mid-request.
const EXPIRY_SKEW_MS = 30 * 1000;

/**
 * Authentication middleware for /api/content/*.
 *
 * Identity comes ONLY from the server-side session (created by the OAuth2
 * code exchange and stored in Redis), never from client-supplied tokens.
 * Previously this decoded the Bearer JWT without verifying its signature, so
 * anyone could forge a token with an arbitrary `sub` and act as that user.
 *
 * On success it sets:
 *   req.user = { sub, token }   // token = the session's QF access token
 */
const extractUserSub = async (req, res, next) => {
  try {
    const session = req.session;
    const sub = session?.user?.sub;

    if (!session?.isLoggedIn || !sub || !session.accessToken) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    // Transparently refresh an expired/expiring access token (needed for
    // calls that forward the token to Quran Foundation, e.g. bookmarks).
    if (
      session.tokenExpiresAt &&
      session.tokenExpiresAt - EXPIRY_SKEW_MS < Date.now()
    ) {
      if (!session.refreshToken) {
        return res.status(401).json({
          success: false,
          message: "Session expired. Please log in again.",
        });
      }
      try {
        const tokenData = await refreshTokens(session.refreshToken);
        session.accessToken = tokenData.access_token;
        if (tokenData.refresh_token) {
          session.refreshToken = tokenData.refresh_token;
        }
        session.expiresIn = tokenData.expires_in;
        session.tokenExpiresAt = Date.now() + tokenData.expires_in * 1000;
      } catch (err) {
        console.error("[Auth] Session token refresh failed:", err.message);
        return res.status(401).json({
          success: false,
          message: "Session expired. Please log in again.",
        });
      }
    }

    req.user = { sub, token: session.accessToken };
    return next();
  } catch (error) {
    console.error("[Auth] Authentication middleware error:", error.message);
    return res.status(401).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

export default extractUserSub;
