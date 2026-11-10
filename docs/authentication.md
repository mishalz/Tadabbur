# Authentication

Login uses the Quran Foundation OAuth2 **authorization-code flow with PKCE** and OpenID Connect. The API is a confidential client: the client secret never leaves the server, and neither do the resulting tokens.

## Flow

1. **`GET /api/auth/login`** creates a session, stores a random `state`, `nonce` and PKCE `code_verifier` in it, and returns the Quran Foundation authorization URL. The browser is redirected there.
2. The user signs in; Quran Foundation redirects to `<APP_BASE_URL>/callback?code=...&state=...` (a client page).
3. **`POST /api/auth/qf/exchange`** (called by that page with the session cookie):
   - rejects the request unless `state` matches the one stored in the session (CSRF protection);
   - exchanges `code` + `code_verifier` for tokens, authenticating with the client secret;
   - checks the ID token's `nonce` against the session;
   - stores the tokens and user claims in the session.
4. Afterwards the browser only holds the **session cookie** (`tadabbur-session`, `httpOnly`, `secure` in production). The session lives in Postgres (`session` table, 7-day rolling expiry).

## Using the session

- `GET /api/auth/me` returns the public user fields (id, email, name).
- Everything under `/api/content/*` goes through `middleware/requireAuth.js`: it requires a logged-in session, refreshes an expired access token server-side using the stored refresh token (401 if that fails), and attaches `req.user = { sub, token }`. The user id always comes from the session, never from client input.
- `GET /api/auth/logout` destroys the session.

## Configuration

| Variable | Purpose |
| --- | --- |
| `QF_ENV` | `prelive` (default) or `production`; selects the Quran Foundation hosts |
| `QF_CLIENT_ID_DEV` / `QF_CLIENT_SECRET_DEV` | credentials for `prelive` |
| `QF_CLIENT_ID_PROD` / `QF_CLIENT_SECRET_PROD` | credentials for `production` |
| `QF_SCOPE` | space-separated scopes (default `openid offline_access user`) |
| `APP_BASE_URL` | frontend origin; the redirect URI is `<APP_BASE_URL>/callback` and must be registered with Quran Foundation |
| `SESSION_SECRET_KEY` | signs the session cookie |
| `COOKIE_SAMESITE` | `lax` when the API is proxied same-site through the frontend host (recommended); defaults to `none` in production |
| `POST_LOGOUT_REDIRECT_URI` | optional post-logout redirect registered with Quran Foundation |

## Notes

- The ID token is decoded (see `decodeJwtPayload` in `auth.service.js`) without signature verification. This is permitted by OpenID Connect because it is received directly from the token endpoint over TLS, and it is only used for the nonce check and basic profile claims. The user's identity for authorisation decisions is the server-side session.
- Never log cookies, `state`, `nonce` or tokens.
