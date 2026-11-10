# Tadabbur client

React + Vite single-page app. See the [root README](../README.md) for setup, scripts and deployment.

```bash
npm install
npm run dev     # http://localhost:5173 (proxies /api to http://localhost:8000)
npm run build   # output in build/
npm run lint
npm test
```

`VITE_API_URL` is normally empty so requests go to relative `/api/...` URLs (proxied by Vite in development and by `public/_redirects` on Netlify). See `.env.example`.
