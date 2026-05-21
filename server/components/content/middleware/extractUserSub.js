import jwt from "jsonwebtoken";

/**
 * Middleware to extract and attach user.sub from JWT token to req.user
 * This ensures all content handlers have access to user.sub consistently
 */
const extractUserSub = (req, res, next) => {
  try {
    // If user is already attached by auth middleware, extract sub and attach it
    if (req.user) {
      // If user.sub already exists, proceed
      if (req.user.sub) {
        return next();
      }
      // If user.id exists but not user.sub, try to get it from token
      const authHeader = req.headers.authorization;
      const userToken =
        authHeader && authHeader.startsWith("Bearer ")
          ? authHeader.slice(7)
          : null;

      req.user.token = userToken; // Attach token for downstream use if needed
      if (userToken) {
        const decoded = jwt.decode(userToken);

        // Validate token expiration
        if (decoded?.exp && decoded.exp * 1000 < Date.now()) {
          return res.status(401).json({
            success: false,
            message: "Token has expired",
          });
        }

        if (decoded?.sub) {
          req.user.sub = decoded.sub;
          return next();
        }
      }
    } else {
      // If no user middleware, extract from token directly
      const authHeader = req.headers.authorization;
      const userToken =
        authHeader && authHeader.startsWith("Bearer ")
          ? authHeader.slice(7)
          : null;

      if (!userToken) {
        return res.status(401).json({
          success: false,
          message: "Missing authentication token",
        });
      }

      const decoded = jwt.decode(userToken);
      // Validate token expiration
      if (decoded?.exp && decoded.exp * 1000 < Date.now()) {
        return res.status(401).json({
          success: false,
          message: "Token has expired",
        });
      }
      const userSub = decoded?.sub;

      if (!userSub) {
        return res.status(401).json({
          success: false,
          message: "Invalid token - missing user ID",
        });
      }

      // Validate token expiration
      if (decoded?.exp && decoded.exp * 1000 < Date.now()) {
        return res.status(401).json({
          success: false,
          message: "Token has expired",
        });
      }

      // Attach user object with sub
      req.user = { sub: userSub, token: userToken };
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Token verification failed",
    });
  }
};

export default extractUserSub;
