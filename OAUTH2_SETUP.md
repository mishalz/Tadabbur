# Quran Foundation OAuth2 & User APIs Implementation

This guide explains how to set up and use the Quran Foundation OAuth2 authentication system with User APIs in this project.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [How It Works](#how-it-works)
4. [API Endpoints](#api-endpoints)
5. [Using User APIs](#using-user-apis)
6. [Token Management](#token-management)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

1. **Quran Foundation Credentials**
   - Request access at: https://api-docs.quran.foundation/request-access
   - You'll receive `QF_CLIENT_ID` and `QF_CLIENT_SECRET`
   - Register your redirect URI (e.g., `http://localhost:3000/callback`)

2. **Environment**: Pre-production (`prelive`) or Production (`production`)
   - Default: Pre-production (`prelive`)

## Environment Setup

### Backend (.env)

Add these variables to your `.env` file in the `server/` directory:

```env
# Quran Foundation OAuth2 Credentials
QF_ENV=prelive
QF_CLIENT_ID_DEV=your_dev_client_id
QF_CLIENT_SECRET_DEV=your_dev_client_secret
QF_CLIENT_ID_PROD=your_prod_client_id
QF_CLIENT_SECRET_PROD=your_prod_client_secret

# App Configuration
APP_BASE_URL=http://localhost:3000
SESSION_SECRET_KEY=your_random_session_secret

# Other
PORT=8000
```

### Frontend (.env.local)

Add these variables to your `.env.local` file in the `client/` directory:

```env
VITE_API_BASE_URL=http://localhost:8000
```

## How It Works

### OAuth2 Authorization Code Flow with PKCE

```
┌─────────────────┐
│  User clicks    │
│   "Login"       │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ 1. Generate PKCE + state + nonce    │
│    POST /api/auth/login             │
│ ◄─────────────────────────────────────
│    Response: { authUrl: "..." }
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ 2. Redirect to QF Authorization URL │
│    User logs in at Quran Foundation │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ 3. QF redirects to /callback        │
│    with code=AUTH_CODE&state=STATE  │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ 4. Exchange code for tokens         │
│    POST /api/auth/qf/exchange       │
│    { code, state }                  │
│ ◄─────────────────────────────────────
│    Response: {                      │
│      accessToken,                   │
│      refreshToken,                  │
│      idToken,                       │
│      user: { sub, email, name }    │
│    }                                │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ 5. Store tokens in context          │
│    Redirect to home page            │
│    User is authenticated!           │
└─────────────────────────────────────┘
```

## API Endpoints

### Authentication Endpoints

#### `GET /api/auth/login`

Initiates OAuth2 login flow.

**Response:**

```json
{
  "authUrl": "https://prelive-oauth2.quran.foundation/oauth2/auth?..."
}
```

**Usage:**

```javascript
const response = await axios.get("/api/auth/login");
window.location.href = response.data.authUrl;
```

#### `POST /api/auth/qf/exchange`

Exchanges authorization code for tokens (called after OAuth2 redirect).

**Request Body:**

```json
{
  "code": "authorization_code_from_callback",
  "state": "state_value_from_callback"
}
```

**Response:**

```json
{
  "success": true,
  "accessToken": "access_token_value",
  "refreshToken": "refresh_token_value",
  "idToken": "id_token_jwt",
  "expiresIn": 3600,
  "tokenType": "Bearer",
  "scope": "openid offline_access user collection bookmark",
  "user": {
    "sub": "user_id",
    "email": "user@example.com",
    "name": "User Name",
    "given_name": "Given",
    "family_name": "Family"
  }
}
```

#### `GET /api/auth/me`

Get current authenticated user info.

**Response:**

```json
{
  "success": true,
  "user": {
    "sub": "user_id",
    "email": "user@example.com",
    "name": "User Name"
  },
  "accessToken": "access_token_value"
}
```

#### `POST /api/auth/refresh`

Refresh the access token using refresh_token.

**Response:**

```json
{
  "success": true,
  "accessToken": "new_access_token",
  "expiresIn": 3600,
  "tokenType": "Bearer"
}
```

#### `GET /api/auth/logout`

Logout user and clear session.

**Response:**

```json
{
  "success": true,
  "logoutUrl": "https://prelive-oauth2.quran.foundation/oauth2/sessions/logout?..."
}
```

### User APIs Proxy Endpoints

All Quran Foundation User APIs are available through proxy endpoints:

#### Bookmarks

- `GET /api/content/bookmarks` - Get all bookmarks
- `POST /api/content/user-api/post/bookmarks` - Create bookmark
- `DELETE /api/content/user-api/delete/bookmarks/{id}` - Delete bookmark

#### Collections

- `GET /api/content/collections` - Get all collections
- `POST /api/content/user-api/post/collections` - Create collection
- `PATCH /api/content/user-api/patch/collections/{id}` - Update collection
- `DELETE /api/content/user-api/delete/collections/{id}` - Delete collection

#### Reading Sessions

- `GET /api/content/reading-sessions` - Get reading sessions
- `POST /api/content/user-api/post/reading-sessions` - Create session
- `PATCH /api/content/user-api/patch/reading-sessions/{id}` - Update session

#### Preferences

- `GET /api/content/preferences` - Get preferences
- `PATCH /api/content/preferences` - Update preferences

#### Generic Proxy

- `GET /api/content/user-api/get/:path` - Generic GET
- `POST /api/content/user-api/post/:path` - Generic POST
- `PATCH /api/content/user-api/patch/:path` - Generic PATCH
- `DELETE /api/content/user-api/delete/:path` - Generic DELETE

## Using User APIs

### From the Client

Tokens are automatically stored in `UserContext` and localStorage.

```javascript
import { useContext } from "react";
import { UserContext } from "../context/UserContext";
import axios from "axios";

function MyComponent() {
  const { user, tokens } = useContext(UserContext);

  const fetchBookmarks = async () => {
    try {
      const response = await axios.get("/api/content/bookmarks", {
        baseURL: "http://localhost:8000",
      });
      console.log("Bookmarks:", response.data);
    } catch (error) {
      console.error("Failed to fetch bookmarks:", error);
    }
  };

  return (
    <div>
      {user.isLoggedIn && (
        <>
          <p>Welcome, {user.username}!</p>
          <button onClick={fetchBookmarks}>Load Bookmarks</button>
        </>
      )}
    </div>
  );
}
```

### From the Server

The backend automatically handles token management:

```javascript
// In a controller
export async function myController(req, res) {
  // Tokens are in req.session
  const accessToken = req.session.accessToken;
  const user = req.session.user;

  // Token is automatically refreshed by middleware if expired
  // No manual refresh needed
}
```

## Token Management

### Frontend Token Storage

Tokens are stored in:

1. **React Context** (`UserContext`) - For in-memory access
2. **localStorage** - For persistence across page reloads

```javascript
const { tokens } = useContext(UserContext);
console.log(tokens.accessToken);
```

### Token Refresh

Token refresh happens automatically:

1. **Automatic API Refresh**: If a request returns 401, axios interceptor attempts refresh
2. **Manual Refresh**: Call `refreshAccessToken()` from context
3. **Session Management**: Backend tracks token expiration

```javascript
const { refreshAccessToken } = useContext(UserContext);

try {
  const newToken = await refreshAccessToken();
} catch (error) {
  // Refresh failed, user needs to login again
  navigate("/"); // Redirect
}
```

### User Identity Claims

Extract user info from the ID token:

```javascript
const { user } = useContext(UserContext);
console.log(user.sub); // Unique user ID (primary key)
console.log(user.email); // Email address
console.log(user.name); // Full name
```

**Important**: Use `sub` as the primary key when linking Quran Foundation users to your app's database.

## Troubleshooting

### "Invalid state parameter - CSRF validation failed"

- **Cause**: State from callback doesn't match stored state
- **Fix**: Ensure session is properly saved; check `SESSION_SECRET_KEY` is set

### "Access token not available"

- **Cause**: User not authenticated
- **Fix**: Redirect to login page; check tokens are being stored

### "Refresh token expired"

- **Cause**: Refresh token has expired (usually after 30 days)
- **Fix**: User must login again with `/api/auth/login`

### "invalid_client" error

- **Cause**: Wrong client type or credentials
- **Fix**:
  - Verify `QF_CLIENT_ID` and `QF_CLIENT_SECRET`
  - Check you're using the confidential client flow (backend exchange)
  - Ensure credentials match the environment (prelive vs production)

### "redirect_uri_mismatch"

- **Cause**: Redirect URI doesn't match registered value
- **Fix**: Register the exact callback URI in Quran Foundation dashboard
  - Example: `http://localhost:3000/callback`
  - Must include protocol, domain, and path

### "Nonce validation failed"

- **Cause**: Nonce from callback doesn't match stored nonce
- **Fix**: Check session is being preserved; verify clock synchronization

### Tokens not persisting after page reload

- **Cause**: localStorage is cleared or blocked
- **Fix**:
  - Check browser privacy settings
  - Ensure `UserContext` is using `localStorage` fallback
  - Check browser console for errors

## Security Notes

1. **CLIENT_SECRET**: Never expose in client-side code; keep on backend only
2. **Refresh Tokens**: Store securely; rotate if compromised
3. **State & Nonce**: Always validate to prevent CSRF and token substitution attacks
4. **HTTPS**: Ensure redirect URI uses HTTPS in production
5. **Scope**: Request only necessary scopes (follow least privilege principle)

## API Reference

For complete API documentation, see:

- [Full OAuth2 Guide](https://api-docs.quran.foundation/docs/tutorials/oidc/getting-started-with-oauth2)
- [User APIs Reference](https://api-docs.quran.foundation/docs/category/user-related-apis)
- [Available Scopes](https://api-docs.quran.foundation/docs/user_related_apis_versioned/scopes)

## Support

- API Documentation: https://api-docs.quran.foundation
- Request Access: https://api-docs.quran.foundation/request-access
- Discord: https://discord.gg/SpEeJ5bWEQ
