# Tadabbur

A full-stack web application for the study and contemplation of the Holy Quran.

Tadabbur provides a focused digital study space where users can explore verses and visualise meaningful semantic or syntactic relationships between them. Its distinguishing feature is the ability to create, store, and visualise your own connections between Quranic verses.

**Live application:** [Open Tadabbur](https://benevolent-rolypoly-b74a4a.netlify.app)

## Overview

The flow of meaning in the Quran is not conventionally unidirectional, rather multiple themes are discussed simultaneously in a Surah, sometimes recurringly appearing elsewhere in the Quran, as well. 
Due to this richness of the flow of meaning, the study of the Quran requires keeping track of the different connections that one comes across within a Surah, between succeeding and preceding Surahs and the recurrence elsewhere in the Quran. 
Tadabbur is designed to make those relationships easier to capture and explore through an interactive web experience.

The application combines a React client with an Express API and a Postgres database to support connected Quranic study rather than isolated verse reading.

## Key Features

- Browse every surah and read its verses (Arabic text with translation).
- Create notes that connect any two verses, and see the connections as an interactive graph.
- Bookmark verses (stored in your Quran Foundation account).
- Log in with Quran Foundation (OAuth2 + PKCE); the tokens never reach the browser.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Client | React 18, Vite, React Router, Tailwind CSS 4, D3 Force (graph), Axios |
| API | Node.js (22 or 24), Express 4, `express-session`, Joi, Helmet, `express-rate-limit` |
| Data | Postgres (any provider; Neon in production) via `pg`, also used for sessions (`connect-pg-simple`) |
| Quran content & login | [Quran Foundation](https://api-docs.quran.foundation) APIs and OAuth2 |
| Tests / CI | `node:test` (API), Vitest (client), ESLint, GitHub Actions |
| Hosting | Netlify (client), Render (API), Neon (database) |

## Project Structure

```text
Tadabbur/
├── client/                    # React + Vite frontend
│   ├── public/_redirects      # Netlify: proxies /api/* to the API, SPA fallback
│   └── src/                   # components, pages, context, lib (api helper), utils
├── server/                    # Express API
│   ├── index.js               # process entry point (listen, graceful shutdown)
│   ├── app.js                 # builds the Express app (no listen; used by tests)
│   ├── config.js              # validated environment configuration
│   ├── qfConfig.js            # Quran Foundation endpoints and credentials
│   ├── db/                    # pg pool and idempotent schema
│   ├── middleware/            # requireAuth, rate limiters, error handlers
│   ├── components/            # auth, content (connections, bookmarks), quran-retrieval
│   └── tests/                 # integration tests
├── docs/authentication.md     # how login and sessions work
└── .github/workflows/ci.yml   # lint, test and build on every PR
```

## Local Development

### Prerequisites

- Node.js 22 or 24 and npm
- A Postgres database (a free [Neon](https://neon.com) project works, or a local install)
- Quran Foundation API credentials ([request access](https://api-docs.quran.foundation/request-access)); register `http://localhost:5173/callback` as a redirect URI

### 1. Install

```bash
git clone https://github.com/mishalz/Tadabbur.git
cd Tadabbur
(cd server && npm install)
(cd client && npm install)
```

### 2. Configure the server

```bash
cp server/.env.example server/.env
```

Fill in `DATABASE_URL`, `SESSION_SECRET_KEY` (any long random string) and the `QF_*` credentials. The server refuses to start if required variables are missing. Tables are created automatically on first start. Never commit `.env` files.

The client needs no configuration locally: Vite proxies `/api` to `http://localhost:8000`.

### 3. Run

```bash
cd server && npm run dev      # API on http://localhost:8000
cd client && npm run dev      # app on http://localhost:5173
```

## Scripts

| Where | Command | What it does |
| --- | --- | --- |
| `server` | `npm run dev` / `npm start` | API with auto-reload / API |
| `server` | `npm run lint` | ESLint |
| `server` | `npm test` | Integration tests (see below) |
| `client` | `npm run dev` / `build` / `preview` | Vite dev server / production build / serve the build |
| `client` | `npm run lint` / `npm test` | ESLint / Vitest |

### Running the API tests

The API tests run the real app against a real Postgres, with Quran Foundation replaced by an in-process fake. They **truncate tables**, so they only use `TEST_DATABASE_URL` (never `DATABASE_URL`) and refuse non-local hosts:

```bash
createdb tadabbur_test
cd server
TEST_DATABASE_URL=postgres://localhost:5432/tadabbur_test npm test
```

Without `TEST_DATABASE_URL`, the database tests are skipped.

## Data Model

Connections are stored relationally:

- `verses`: the verse key (`2:255`) with its Arabic text and translation.
- `connections`: a user's note linking two verses. Connections are direction-independent: a unique index on `(user, least(a, b), greatest(a, b))` allows one connection per pair per user.
- `session`: login sessions.

The graph view is built in the client from a verse's connections.

## Deployment

| Piece | Setting |
| --- | --- |
| **Netlify** (client) | Base directory `client`, build command `npm run build`, publish directory `client/build`, env var `VITE_API_URL` **empty**. `client/public/_redirects` proxies `/api/*` to the API so the session cookie is first-party. |
| **Render** (API) | Root directory `server`, build `npm install`, start `npm start`. Environment: `NODE_ENV=production`, `DATABASE_URL`, `SESSION_SECRET_KEY`, `APP_BASE_URL` (the Netlify URL), `COOKIE_SAMESITE=lax`, `QF_ENV`, `QF_CLIENT_ID_*`, `QF_CLIENT_SECRET_*`, `QF_SCOPE`. |
| **Quran Foundation** | Register `<APP_BASE_URL>/callback` as the redirect URI. |
| **Keep-alive** | Free Render services sleep when idle. Point an uptime monitor at `GET /ping` (no database access) every ~10 minutes. `GET /healthz` also checks the database; avoid polling it frequently so an auto-suspended free-tier database can sleep. |

## Security Notes

- Secrets live in environment variables only; `.env` is git-ignored.
- OAuth tokens are kept in the server-side session and never sent to the browser; the session cookie is `httpOnly` and `secure` in production.
- Content routes require a logged-in session; every connection query is scoped to the user.
- The API sets security headers (Helmet), limits request size, and rate-limits `/api` (and more tightly `/api/auth`).
- Restrict OAuth redirect URLs to known local and production domains.

## Contributing

1. Create a feature branch.
2. Make focused changes with tests; run `npm run lint` and `npm test` in the affected directory.
3. Open a pull request. CI runs lint, tests and the client build.

## Acknowledgements

Tadabbur is built to support thoughtful engagement with the Holy Quran through technology, structured exploration, and visual understanding of interconnected verses.
