# TeraPlayer — Product Requirements & Progress

## Original Problem Statement
Build TeraPlayer, a modern website where users paste a public TeraBox share link and instantly preview the video, watch online, download, browse folders, view thumbnails/metadata, and download multiple files. Should look and feel like a premium streaming platform (Netflix / Google Drive / Dropbox / SaaS), not a basic downloader.

## Adapted Stack
- **Frontend**: React (CRA) + Tailwind + Framer Motion + Sonner + lucide-react + Shadcn UI + JSZip + file-saver
- **Backend**: FastAPI + httpx + selectolax + motor (async MongoDB)
- **Database**: MongoDB
- **Auth**: Emergent-managed Google Auth (OPTIONAL); anonymous session_id fallback via localStorage

## User Personas
1. Casual viewer – paste, click, watch, no signup.
2. Downloader – single or bulk downloads with ZIP + progress.
3. Power user – folder navigation, history, favorites, cross-device sync.

## Architecture
```
/app/backend/
  server.py                # /api/* routes, auth, rate limiter, streaming proxy
  services/
    extractors.py          # native + 3 fallback workers, password-aware, password_required signal
    terabox.py             # orchestrator + 5-min cache
    auth.py                # session_id exchange, cookie/Bearer verification
    rate_limit.py          # Mongo TTL-backed, honors X-Forwarded-For
  models/
    terabox.py             # Pydantic models incl. password_required
    auth.py                # User, UserSession

/app/frontend/src/
  App.js                   # AppRouter detects session_id fragment during render
  pages/
    Home.jsx               # Hero → preview → player → downloader → folder browser
    AuthCallback.jsx       # Exchanges session_id, redirects home
  context/
    ThemeContext.jsx
    AuthContext.jsx        # user, login (→ auth.emergentagent.com), logout, refresh
  components/
    Header.jsx             # Sign-in button OR avatar dropdown
    HeroInput.jsx
    PreviewCard.jsx
    VideoPlayer.jsx
    DownloadPanel.jsx
    HistoryDrawer.jsx
    FolderBrowser.jsx      # breadcrumbs, list/grid, sort, search, select-all, ZIP
    PasswordDialog.jsx
    QualityPicker.jsx
  services/api.js          # withCredentials axios client + auth endpoints
  lib/session.js
```

## APIs
- `POST /api/preview | /watch | /download | /folder` — `{url, password?}` → PreviewResponse (includes `password_required`)
- `GET /api/stream?url=...` — Range-aware upstream proxy
- `POST /api/auth/session` (exchange session_id → cookie + user), `GET /api/auth/me`, `POST /api/auth/logout`
- `POST /api/history`, `GET /api/history`, `DELETE /api/history[/{id}]`
- `POST /api/favorites`, `GET /api/favorites`, `DELETE /api/favorites/{id}`
- All history/favorites are scoped by `user_id` when authed (via cookie or `Authorization: Bearer`), otherwise by `session_id`.

## Completed (2026-02)

### Iteration 1
- [x] Backend + Mongo scaffolding, rate limiter, streaming proxy, all endpoints
- [x] Native + 3 public-worker extractors with graceful degradation
- [x] Cinematic dark UI (Obsidian + Electric Azure), Outfit + Manrope
- [x] Hero paste input, preview card, custom video player, download panel
- [x] Anonymous history & favorites
- [x] Theme toggle (light/dark/system)
- [x] Deep-link `?url=` auto-analyze
- Tests: 14/14 backend, 5/5 frontend

### Iteration 2
- [x] **Rich folder browser** — breadcrumbs, list/grid toggle, sort (name / size / type), in-folder search, select-all
- [x] **Bulk download as ZIP** — client-side JSZip + file-saver, streamed via proxy with progress
- [x] **Quality selection** — auto-detects 720p/1080p/etc. and renders a Shadcn `Select`
- [x] **Password-protected link prompt** — modal dialog + backend `password` param; extractor sets `password_required` flag
- [x] **MongoDB-backed rate limiter** — 60/min per real IP (X-Forwarded-For aware), TTL auto-cleanup, no Redis
- [x] **Emergent-managed Google Auth** — optional sign-in; httpOnly cookie; syncs history/favorites by `user_id`
- Tests: 20/20 backend (rate-limit XFF fix verified — bursts of 140 requests produced 429s), 8/8 frontend

## Deferred / Backlog

### P1
- [ ] Migrate FastAPI `@on_event` → `lifespan` context manager
- [ ] Add TTL index on `user_sessions.expires_at` for stale-session cleanup
- [ ] Persistent extractor cache in Mongo (currently in-memory)
- [ ] Nested folder navigation (real subfolder trees when extractor exposes them)

### P2
- [ ] Server-side download job queue (chunked ZIPs > 2 GB)
- [ ] Progressive image thumbnails / blurhash
- [ ] Analytics dashboard (server-side, opt-in)
- [ ] PostgreSQL adapter

## Known Constraints
- Third-party TeraBox mirror workers occasionally go offline. UI degrades gracefully with a clear error panel.
- Password-required detection is heuristic (matches "password/pwd" in extractor error strings) and depends on the third-party API wording.
- Streaming proxy is stateless; `<video>` seeking works via Range headers.

## Next Action Items
1. Add `lifespan` migration + user_sessions TTL index for polish.
2. Persist extractor cache in Mongo so pod restarts don't invalidate every link.
3. Explore Cloudflare Worker mirror for even more resilient extraction.
