# TeraPlayer

A modern web app for previewing, watching, and downloading public TeraBox share links.
Designed for production deployment on Render, Railway, or any platform supporting FastAPI + static sites.

## Stack
- **Frontend**: React (CRA) + Tailwind + Framer Motion + Sonner + Shadcn UI + JSZip
- **Backend**: FastAPI + httpx + selectolax + motor (async MongoDB)
- **Database**: MongoDB (Atlas free tier recommended)
- **Auth**: Emergent-managed Google Auth (OPTIONAL) — anonymous by default
- **Cache**: MongoDB-backed persistent cache (survives restarts)
- **Worker**: Cloudflare Worker (optional, for resilient extraction)

## Features
- Paste any public TeraBox link → instant preview (thumbnail, title, size, type)
- Custom cinematic video player (keyboard shortcuts, PIP, speed, fullscreen)
- Streaming proxy with HTTP Range support (smooth `<video>` seeking)
- Multi-mirror extractor: native + public worker fallbacks
- Rich folder browser: breadcrumbs, list/grid toggle, sort, search, ZIP downloads
- Quality picker for multi-resolution shares
- Password-protected link support
- Anonymous history/favorites (per browser) — syncs with Google sign-in
- MongoDB-backed per-IP rate limiter (configurable)
- Light / Dark / System theme
- Fully mobile-responsive

## Quick Start — Local Development

### Prerequisites
- Python 3.10+
- Node.js 18+ and Yarn
- MongoDB 5+ (local or Docker: `docker run -d -p 27017:27017 mongo`)

### Backend
```bash
cd backend
cp .env.example .env    # Edit MONGO_URL, CORS_ORIGINS, etc.
python -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### Frontend
```bash
cd frontend
cp .env.example .env    # Set REACT_APP_BACKEND_URL=http://localhost:8001
yarn install
yarn start
```

Open http://localhost:3000.

---

## Production Deployment

TeraPlayer is optimized for **Render** and **Railway** (PaaS platforms), with
**MongoDB Atlas** free tier for storage.

### Option 1: Deploy with Render Blueprint (Recommended)

The provided `render.yaml` declares both services. You can deploy with one click
from the Render dashboard:

1. Push this repo to GitHub/GitLab
2. In Render Dashboard → New → Blueprint
3. Connect your repository
4. Fill in the secret env vars (MONGO_URL, etc.)
5. Deploy

### Option 2: Manual Deploy — Backend (Render/Railway)

| Setting | Value |
|---------|-------|
| **Runtime** | Python 3 |
| **Build command** | `pip install -r requirements.txt` |
| **Start command** | `uvicorn server:app --host 0.0.0.0 --port $PORT --workers 1 --limit-concurrency 100 --backlog 2048` |
| **Health check** | `/api/health` |

Required environment variables:

| Variable | Description |
|----------|-------------|
| `MONGO_URL` | MongoDB connection string (Atlas SRV URL) |
| `DB_NAME` | Database name (default: `teraplayer`) |
| `CORS_ORIGINS` | Comma-separated frontend URLs (e.g. `https://teraplayer.netlify.app`) |

Optional environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `INFO` | Log level (`DEBUG`, `INFO`, `WARNING`, `ERROR`) |
| `RATE_LIMIT_MAX` | `60` | Max requests per window per IP |
| `RATE_LIMIT_WINDOW` | `60` | Rate limit window in seconds |
| `WEB_CONCURRENCY` | `1` | Number of uvicorn workers |
| `COOKIE_JSON` | — | TeraBox ndus cookie `{"ndus":"..."}` for authenticated extraction |
| `TERABOX_WORKER_URL` | — | Cloudflare Worker URL for extraction |

### Option 3: Manual Deploy — Frontend (Vercel / Netlify)

| Setting | Value |
|---------|-------|
| **Framework** | Create React App |
| **Build command** | `yarn install && yarn build` |
| **Publish directory** | `build` |
| **Environment variable** | `REACT_APP_BACKEND_URL` = your backend URL |

### Option 4: Manual Deploy — Cloudflare Worker (Extraction)

See `cloudflare-worker/CLOUDFLARE_WORKER.md` for deployment instructions.

Once deployed, set `TERABOX_WORKER_URL` on your backend to use it as the
primary extractor.

## Database — MongoDB Atlas

1. Create a free M0 cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. In Database Access → Add a database user (generate password)
3. In Network Access → Add `0.0.0.0/0` (allow all — Render has dynamic IPs)
4. Click Connect → Drivers → copy the SRV connection string
5. Set `MONGO_URL` in your backend environment variables

## Environment Reference

### Backend (`backend/.env`)
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=teraplayer
CORS_ORIGINS=https://your-frontend.vercel.app
LOG_LEVEL=INFO
RATE_LIMIT_MAX=60
RATE_LIMIT_WINDOW=60
WEB_CONCURRENCY=1
COOKIE_JSON=
TERABOX_NDUS=
TERABOX_WORKER_URL=
```

### Frontend (`frontend/.env`)
```
REACT_APP_BACKEND_URL=https://your-backend.onrender.com
```

## Architecture Notes

- **Lifespan**: Uses FastAPI `lifespan` context manager (replaced deprecated `@on_event`)
- **Caching**: Extraction results cached in MongoDB (TTL: 5 min) — survives pod restarts
- **Logging**: Structured JSON output for log aggregators (Datadog, Logtail, etc.)
- **Rate Limiting**: Per-IP via `X-Forwarded-For` header; configurable window/limit
- **Auth**: Emergent-managed Google OAuth (optional); anonymous by default
- **Session cleanup**: TTL index on `user_sessions.expires_at` auto-cleans stale sessions

## Third-Party Extractors

When the native extractor and Cloudflare Worker are unavailable, TeraPlayer
falls back to community-run public worker APIs:
- `hnn` (terabox.hnn.workers.dev)
- `teradl` (teradl-api.vercel.app)

These go up/down independently. When all fail, the UI shows a graceful error
panel with a hint to configure `COOKIE_JSON` for authenticated extraction.

## License

Personal / educational use. Respect the original content owners on any TeraBox
share you access.
