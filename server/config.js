import "dotenv/config";

/**
 * Central, validated application configuration.
 *
 * Everything the app reads from the environment (apart from the Quran
 * Foundation credentials, see qfConfig.js, and the database URL, see
 * db/pool.js) goes through here, so a misconfigured deploy fails at startup
 * with a clear message instead of misbehaving at the first request.
 */
const env = process.env.NODE_ENV || "development";
const isProduction = env === "production";

const missing = ["SESSION_SECRET_KEY", "DATABASE_URL"].filter(
  (name) => !process.env[name],
);
// The frontend origin drives CORS and the OAuth redirect URI.
if (isProduction && !process.env.APP_BASE_URL) missing.push("APP_BASE_URL");

if (missing.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missing.join(", ")}`,
  );
}

const SAME_SITE_VALUES = ["lax", "strict", "none"];

const resolveSameSite = () => {
  const raw = process.env.COOKIE_SAMESITE;
  const override = (raw || "").trim().toLowerCase();
  if (SAME_SITE_VALUES.includes(override)) return override;

  if (raw !== undefined && raw.trim() !== "") {
    console.warn(
      `[config] Ignoring invalid COOKIE_SAMESITE "${raw}" (expected ${SAME_SITE_VALUES.join(", ")}).`,
    );
  }
  // "none" is only needed when the API is called cross-site (and needs Secure).
  return isProduction ? "none" : "lax";
};

const config = Object.freeze({
  env,
  isProduction,
  port: Number(process.env.PORT) || 8000,
  appBaseUrl: process.env.APP_BASE_URL || "http://localhost:5173",
  sessionSecret: process.env.SESSION_SECRET_KEY,
  qfScope: process.env.QF_SCOPE || "openid offline_access user",
  // Number of reverse proxies in front of the app (Render's load balancer = 1).
  trustProxyHops: Number(process.env.TRUST_PROXY_HOPS ?? 1),
  cookie: Object.freeze({
    name: "tadabbur-session",
    maxAgeMs: 1000 * 60 * 60 * 24 * 7, // 7 days
    secure: isProduction,
    sameSite: resolveSameSite(),
  }),
});

export default config;
