# Quran Foundation OAuth2 Implementation - Quick Start Guide

## Overview

This implementation provides a complete OAuth2 Authorization Code flow with PKCE and OpenID Connect for authenticating users with Quran Foundation and accessing their User APIs (bookmarks, collections, reading progress, preferences, etc.).

## What Was Implemented

### Backend Files

**Authentication Flow**
- [server/components/auth/auth.controller.js](/server/components/auth/auth.controller.js)
  - `GET /api/auth/login` - Initiates OAuth2 flow
  - `POST /api/auth/qf/exchange` - Exchanges authorization code for tokens
  - `POST /api/auth/refresh` - Refreshes access token
  - `GET /api/auth/me` - Gets current user info
  - `GET /api/auth/logout` - Logs out user

- [server/components/auth/auth.service.js](/server/components/auth/auth.service.js)
  - OAuth2 flow helpers
  - PKCE generation
  - State and nonce validation
  - Token claim extraction

**User APIs Proxy**
- [server/components/content/user-api.controller.js](/server/components/content/user-api.controller.js)
  - Proxies all Quran Foundation User API calls
  - Automatically includes required auth headers
  - Generic handlers for GET, POST, PATCH, DELETE

- [server/components/content/content.routes.js](/server/components/content/content.routes.js)
  - Routes for bookmarks, collections, reading sessions, preferences
  - Generic proxy route handlers

### Frontend Files

**Authentication UI**
- [client/src/components/Login.jsx](/client/src/components/Login.jsx)
  - Login/logout buttons
  - OAuth2 flow initiation
  - Error handling

**OAuth2 Callback**
- [client/src/pages/CallbackPage.jsx](/client/src/pages/CallbackPage.jsx)
  - Handles OAuth2 redirect from Quran Foundation
  - Exchanges code for tokens
  - Redirects to home on success

**Context & State Management**
- [client/src/context/UserContext.jsx](/client/src/context/UserContext.jsx)
  - OAuth2 token storage
  - User info management
  - Automatic token refresh
  - localStorage persistence
  - Axios interceptor for 401 handling

**Routing**
- [client/src/App.jsx](/client/src/App.jsx)
  - Added `/callback` route for OAuth2 redirect handling

### Configuration Files

- [server/.env.example](/server/.env.example) - Backend environment variables template
- [client/.env.example](/client/.env.example) - Frontend environment variables template
- [OAUTH2_SETUP.md](/OAUTH2_SETUP.md) - Complete setup and usage documentation

## Getting Started

### 1. Prerequisites

Get Quran Foundation credentials:
- Go to: https://api-docs.quran.foundation/request-access
- Submit application
- Receive: `CLIENT_ID` and `CLIENT_SECRET`
- Register redirect URI: `http://localhost:3000/callback` (for local development)

### 2. Backend Setup

```bash
cd server

# Copy example env file
cp .env.example .env

# Edit .env and add your credentials
# QF_CLIENT_ID_DEV=your_client_id
# QF_CLIENT_SECRET_DEV=your_client_secret
# APP_BASE_URL=http://localhost:3000
# SESSION_SECRET_KEY=generate_random_string

# Generate a random session secret:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Install dependencies
npm install

# Start server
npm run dev
```

### 3. Frontend Setup

```bash
cd client

# Copy example env file
cp .env.example .env.local

# Edit .env.local
# VITE_API_BASE_URL=http://localhost:8000

# Install dependencies
npm install

# Start dev server
npm run dev
```

### 4. Test the Flow

1. Open http://localhost:3000 in your browser
2. Click "Login with Quran Foundation"
3. You'll be redirected to Quran Foundation login
4. Log in or create a Quran.com account
5. Consent to requested permissions
6. You'll be redirected back to `/callback`
7. Tokens will be exchanged and stored
8. You'll be redirected to home page
9. You should see your username and logout button

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Vite + React)                │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Login.jsx          - Login button and logout             │
│  2. CallbackPage.jsx   - Handles OAuth redirect              │
│  3. UserContext.jsx    - Token storage and refresh logic     │
│  4. App.jsx            - Routes including /callback          │
│                                                               │
│  Tokens stored in:                                            │
│  - React Context (in-memory)                                 │
│  - localStorage (persistence)                                │
│                                                               │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ API Calls + Session
                   │
┌──────────────────▼──────────────────────────────────────────┐
│                Backend (Express + Node.js)                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  /api/auth/login          → Generate PKCE + Auth URL         │
│  /api/auth/qf/exchange    → Exchange code for tokens         │
│  /api/auth/refresh        → Refresh access token             │
│  /api/auth/me             → Get current user                 │
│  /api/auth/logout         → Clear session                    │
│                                                               │
│  /api/content/bookmarks   → Get/manage bookmarks             │
│  /api/content/collections → Get/manage collections           │
│  /api/content/...         → Other User API proxies           │
│                                                               │
│  Sessions:                                                    │
│  - Stored in-memory (or Redis for production)                │
│  - Contains: accessToken, refreshToken, idToken, user        │
│                                                               │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ OAuth2 + PKCE Flow
                   │
┌──────────────────▼──────────────────────────────────────────┐
│        Quran Foundation OAuth2 & User APIs                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  https://prelive-oauth2.quran.foundation                     │
│  - /oauth2/auth           - Authorization endpoint           │
│  - /oauth2/token          - Token exchange                   │
│                                                               │
│  https://apis-prelive.quran.foundation                       │
│  - /auth/v1/bookmarks     - User bookmarks API               │
│  - /auth/v1/collections   - User collections API             │
│  - /auth/v1/...           - Other User APIs                  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Key Implementation Details

### 1. OAuth2 Flow (Confidential Client)

The implementation follows the recommended **backend-safe** pattern:

1. **Client** initiates login (generates PKCE in browser)
2. **Client** redirects user to QF login page
3. **QF** redirects back with authorization code
4. **Client** sends code to backend (never shows client_secret to user)
5. **Backend** exchanges code for tokens using client_secret
6. **Backend** validates state and nonce
7. **Client** stores tokens for API calls

### 2. Token Management

- **Access Token**: 1 hour expiration, used for API calls
- **Refresh Token**: Longer expiration, used to get new access tokens
- **ID Token**: JWT containing user identity claims (sub, email, name)

### 3. Scopes

The implementation requests:
- `openid` - OpenID Connect
- `offline_access` - Refresh tokens
- `user` - User profile info
- `collection` - Collections API
- `bookmark` - Bookmarks API

Request additional scopes only when needed (least privilege).

### 4. User Identification

Use the `sub` claim from the ID token as your primary key:

```javascript
const userId = user.sub; // Unique Quran Foundation user ID
```

Store this in your database to link Quran Foundation users to your app's data.

## Scope Reference

| Scope | Purpose |
|-------|---------|
| `openid` | OpenID Connect identity claims |
| `offline_access` | Refresh tokens |
| `user` | User profile (email, name) |
| `bookmark` | Bookmarked verses API |
| `collection` | Collections API |
| `reading_session` | Reading progress API |
| `preference` | User preferences API |
| `goal` | Reading goals API |
| `streak` | Reading streaks API |

Request only what your app needs!

## Common Tasks

### Get User Bookmarks

```javascript
// Frontend
const response = await axios.get("/api/content/bookmarks");
const bookmarks = response.data;
```

### Get User Collections

```javascript
// Frontend
const response = await axios.get("/api/content/collections");
const collections = response.data;
```

### Refresh Token Manually

```javascript
// Frontend
const { refreshAccessToken } = useContext(UserContext);
const newToken = await refreshAccessToken();
```

### Call Any User API

```javascript
// Frontend - Use generic proxy
const response = await axios.post(
  "/api/content/user-api/post/collections",
  { name: "My Collection" }
);
```

## Troubleshooting

### "Missing Quran Foundation API credentials"

**Solution**: Check `.env` file has credentials set
```bash
QF_CLIENT_ID_DEV=your_id
QF_CLIENT_SECRET_DEV=your_secret
```

### "Invalid state parameter"

**Solution**: Ensure session is being saved properly. Check:
- `SESSION_SECRET_KEY` is set in .env
- Session middleware is configured in server/index.js
- Cookies are enabled in browser

### Tokens not persisting after reload

**Solution**: UserContext saves to localStorage automatically. Check:
- localStorage is enabled in browser
- No errors in browser console
- Check Application tab in DevTools

### "redirect_uri_mismatch"

**Solution**: Ensure registered redirect URI matches exactly
- Register in Quran Foundation: `http://localhost:3000/callback`
- Set in .env: `APP_BASE_URL=http://localhost:3000`

## Next Steps

1. **Request User API Scopes**: Add more scopes to `buildAuthorizationUrl()` in auth.service.js as needed
2. **Add Database**: Implement user registration/linking with your database
3. **Error Handling**: Add comprehensive error handling and user feedback
4. **Testing**: Write tests for OAuth2 flow
5. **Deployment**: Set up production credentials and HTTPS

## Documentation

- [Full Setup Guide - OAUTH2_SETUP.md](/OAUTH2_SETUP.md)
- [Quran Foundation Full OAuth2 Guide](https://api-docs.quran.foundation/docs/tutorials/oidc/getting-started-with-oauth2)
- [User APIs Reference](https://api-docs.quran.foundation/docs/category/user-related-apis)
- [OpenID Connect Guide](https://api-docs.quran.foundation/docs/tutorials/oidc/openid-connect)

## Support

- 📧 Email: developers@quran.com
- 💬 Discord: https://discord.gg/SpEeJ5bWEQ
- 📚 Docs: https://api-docs.quran.foundation
