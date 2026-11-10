import rateLimit from "express-rate-limit";

const tooManyRequests = (_req, res) => {
  res.status(429).send({
    success: false,
    message: "Too many requests. Please try again later.",
  });
};

const limiter = (max) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: max,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: tooManyRequests,
  });

// Limits are per client IP and deliberately generous: when the API sits behind
// a proxy (Netlify -> Render) several users can share one apparent IP.
export const apiLimiter = limiter(600);
// Login / token endpoints are the abuse targets worth a tighter bound.
export const authLimiter = limiter(60);
