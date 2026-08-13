# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

## [v0.5.0-alpha] - 2026-08-13

### Added
- **Tiptap JSON Rich Text Engine**: Lossless document AST storage (`content_json`), in-memory plain text parser (`extract_text_from_tiptap_json`), and floating contextual bubble toolbar (`EditorBubbleMenu.tsx`) supporting inline styles, H1–H3 headings, quotes, lists, themed link insertion, clear formatting, and multi-mime HTML clipboard copying.

## [v0.4.2-alpha] - 2026-08-07

### Added
- **Admin User Directory & Activity Management**: Added paginated user table (`UsersTab.tsx`) with real-time email search, per-user activity counters (journal entries & AI chat counts), account deactivation/reactivation toggle with instant session token revocation, and cascading user account deletion modal.
- **Admin User Management Endpoints**: Added `GET /api/v0/admin/users`, `PATCH /api/v0/admin/users/{id}/status`, and `DELETE /api/v0/admin/users/{id}` with BSON `PydanticObjectId` validation and admin self-protection guardrails.
- **HTTP 204 No Content Handling**: Fixed frontend API client (`api.ts`) to gracefully handle empty 0-byte `204 No Content` response bodies without throwing JSON syntax errors.

## [v0.4.1-alpha] - 2026-08-07

### Added
- **Admin Monitoring & Analytics Dashboard**: Added Overview tab with dynamic time period filtering (7d, 14d, 30d, 90d), lifetime scale cards, period velocity metrics, pure SVG signup sparkline, acquisition channels, email verification status, and retention/stickiness benchmarks.
- **FastAPI Stats Endpoint**: Added `GET /api/v0/admin/stats` with parallel MongoDB queries via `asyncio.gather()` in a dedicated `app/admin/` domain module.
- **Frontend Code Splitting**: Lazy-loaded `AdminView.tsx` with `React.lazy()` + `Suspense` to isolate admin bundle (~35kB) from regular users.
- **Admin Stats Test Suite**: Added E2E tests covering default/custom period filtering and role authorization in `backend/tests/E2E/admin/test_admin_stats.py`.

### Changed
- **Unified Monorepo Migration**: Consolidated `backend` and `frontend` submodules into a single unified monorepo repository using `git subtree`, preserving 100% of historical commits, dates, and author logs. Simplified local workflow and CI/CD pipelines.

## [v0.4.0-alpha] - 2026-07-27

### Added
- **Active User Session & Device Management**:
  - Captured browser/OS device info, IP address, and formatted date/time timestamps on login and token rotation
  - Added **Instant Remote Session Ejection (0-Second Revocation)** via Redis family blacklisting (15-min TTL)
  - Embedded `fam` claim in access token JWT for 100% reliable `is_current` identification and instant middleware rejection
  - Integrated `ActiveSessionsCard.tsx` in SettingsView with live device status (`This Device • Active Now`) and single-click remote revocation
  - Extended E2E test suite in `backend/tests/E2E/auth/test_sessions.py` covering session listing, single/bulk revocation, instant remote ejection, and logout cleanup
- **Dual-Token Authentication Architecture with Refresh Token Rotation (RTR)**:
  - Short-lived stateless JWT `access_token` (15 min, `HttpOnly` cookie, scoped to `/api/v0`)
  - Long-lived hashed `refresh_token` (30 days, `HttpOnly` cookie, scoped to `/api/v0/auth/refresh`) stored in MongoDB (`refresh_tokens` collection)
  - **Refresh Token Rotation**: Each refresh generates a new refresh token document within the same session `family_id`
  - **Reuse Attack Detection**: Reusing a revoked refresh token triggers instant revocation of all tokens in that `family_id`
  - **Automatic Cleanup**: MongoDB TTL index (`expireAfterSeconds`) automatically purges expired tokens
  - **Backend Endpoint**: Added `POST /api/v0/auth/refresh` route and facade integration
  - **Frontend Silent Refresh**: Added concurrency-safe subscriber queue in `frontend/src/utils/api.ts` so multiple simultaneous `401 Unauthorized` responses trigger a single `/auth/refresh` request and transparently retry pending calls
  - **End-to-End Test Suites**: Added E2E tests for token issuance, rotation, reuse mitigation, and silent refresh interceptor behavior in `backend/tests/E2E/auth/test_refresh_tokens.py` and `frontend/e2e/auth.spec.ts`

### Changed
- **Migrated AI Chat from WebSocket to SSE streaming** — replaced the full-duplex WebSocket protocol (`/api/v0/chat/ws`) with HTTP POST + Server-Sent Events (`POST /api/v0/chat/stream`):
  - Removed `ConnectionManager`, `GenerationManager`, `MessageDedupStore` (~500 lines of in-memory state management)
  - Replaced `@router.websocket` with `FastAPI StreamingResponse` yielding SSE events
  - Frontend: replaced `WebSocket` + reconnect logic with `fetch()` + `ReadableStream` + `AbortController` for cancellation
  - Removed `useWebSocketConnection.ts`, renamed `useChatWebSocket.ts` → `useChatStream.ts`
  - Cleaned up WS action types in reducer (`WS_CONNECTED` → `CONNECTED`, etc.) and simplified `ConnectionState` (removed unused `'reconnecting'`)
  - Nginx: removed `Upgrade`/`Connection` headers, configured `proxy_buffering off` for SSE route
  - Removed stale `VITE_WS_URL` env var from Dockerfile, CI, docker-compose, and config
  - Cleaned up documentation: deleted `backend/docs/features/chat.md` and `frontend/docs/features/websocket-chat.md`

### Added
- **Google OAuth Sign-In** — Redirect-based Google Sign-In via Authorization Code flow:
  - `GoogleOAuthService` — server-to-server code exchange, state JWT (CSRF), userinfo retrieval
  - `GET /auth/google/login` — redirects to Google consent screen
  - `GET /auth/google/callback` — code exchange, find-or-create user (link by email), sets HttpOnly cookies
  - Google-only users (`hashed_password=None`) get `400` on email/password login: "This account uses Google Sign-In"
- **HttpOnly Cookie Auth Transport** — JWT moved from `localStorage` to HttpOnly `access_token` cookie:
  - `CookieService` — sets/clears auth + `session_exists` cookies
  - `TokenBlacklistService` — Redis-backed JWT blacklist for immediate logout; graceful no-op when `redis_url=None`
  - `get_current_user` reads only from `access_token` cookie (no `Authorization: Bearer` fallback)
  - `POST /auth/logout` — blacklists token, clears cookies
  - `User` model: `hashed_password` nullable, added `google_id` field
  - `UserRepository`: `find_by_google_id()`, `link_google_account()`, `mark_verified()`
- **Frontend Cookie Auth Migration**:
  - `api.ts` — removed `Authorization: Bearer`, all requests use `credentials: 'include'`
  - `authSession.ts` — generation-only snapshots (no token tracking)
  - `AuthContext.tsx` — cookie-based verify, login, logout; no localStorage token storage
  - `ThemeContext.tsx` — removed manual Bearer headers, uses `credentials: 'include'`
  - `useWebSocketConnection.ts` — same-origin WS URL (via `window.location`), no `?token=` param
  - `LoginPage.tsx` — "Sign in with Google" button with Google SVG icon, "or sign in with email" divider
- **Email Verification System** — Full email verification flow using Resend:
  - `POST /auth/verify-email/{token}` — verify email address via token link
  - `POST /auth/resend-verification` — resend verification email
  - `EmailService` wrapper around Resend SDK for transactional emails
  - Verification tokens stored in MongoDB with 24h expiry
  - Auto-verification on registration when `EMAIL_VERIFICATION_REQUIRED=false`
  - `is_verified` field now actually set to `True` when user verifies
  - New `AuthModuleConfig` settings: `email_verification_required`, `verification_token_expire_hours`
  - New `Settings` fields: `resend_api_key`, `from_email`, `verification_url_base`
  - Frontend: `AuthContainer` & `AuthContext` wired to real verify/resend API calls

## [v0.3.0-alpha] - 2026-07-18

### Added
- **Tag Registry (Phase 1)** — hybrid embedded+registry model:
  - `Tag` Beanie document collection with compound index `(user_id, name)`
  - Tag CRUD repository: upsert, remove, replace, list, get-all, rename, delete
  - Tag sync on journal create/update/delete in `JournalFacade`
  - `color` field on Tag model + `PATCH /tags/{name}` endpoint for color updates
  - Tag normalization: lowercase, strip, dedup, `[\w\s-]` only, max 20 per journal, max 50 chars each
  - Backend config: `max_tags_per_journal`, `max_tag_length`
- **Tag Filtering (Phase 2)** — `GET /journals?tags=growth&tags=personal`:
  - Backend: `tag_mode` query param (`or`/`and`) — `$in` vs `$all` MongoDB operator
  - Frontend: OR/AND toggle in filter panel
- **Frontend Tag Autocomplete (Phase 3)**:
  - `useAllTags()` hook fetching `/tags/all` with 60s staleTime
  - Server-backed `allTags` merge (server → entries → local unsynced)
  - `#hashtag` regex extended to support hyphens: `#([\w-]+)`
  - Case-insensitive `addTagDirect` and `isEntrySynced` fixes
  - Autocomplete dropdown on the explicit `+` tag input with keyboard navigation
- **Tag Management UI (Phase 4.1)**:
  - `TagManager` modal: browse, rename, delete tags with usage counts
  - Color picker with 10 presets per tag
  - Tag cloud toggle (font-size proportional to `usage_count`)
- **Tag Colors (Phase 5.2)**:
  - Color propagation to timeline cards, editor tag pills, and filter buttons
  - `tagColorMap` passed through JournalView → JournalTimeline/JournalPage
- **Tag E2E Tests** — 11 new tests covering list, prefix search, rename (with merge), delete, nonexistent tags
- **WebSocket Chat Robustness (Phases 1-4)**:
  - Three-state message dedup with ack protocol to prevent duplicate LLM calls
  - `cancel` message type for non-destructive stop streaming
  - `edit` message type for editing past messages
  - Generation manager with 10s grace period and resume capability
  - App-level heartbeat (ping every 20s, timeout at 30s)
  - ConnectionManager: per-user cap (5), oldest-eviction, `last_pong` tracking
  - Zombie connection cleanup (60s sweep, 5min idle threshold)
  - `retry_after_seconds` in rate limit error responses
  - `generation_resumed` / `generation_lost` WS messages for resume UX
- **Frontend auto-reconnect**:
  - Jittered exponential backoff (1s–30s, 15 max attempts)
  - Token expiry check before reconnect
  - Message queue with 5s bounded ack-wait, retry-once, fail-skip
  - Connection state machine (connected/reconnecting/disconnected/failed)
  - Close code handling (4001→failed, 4003→reconnecting, 1000/1001→reconnect)
  - Subtle connection status pill + per-message delivery indicators
  - "Still connecting…" hint after 5s
  - "Generating…" animation for pre-first-token state
  - "Resumed" toast on successful generation resume
- **Backend Rate Limiting**: Replaced custom in-memory rate limiter with slowapi + Redis.
  - Redis backend for shared rate limit state across blue/green containers (production).
  - Per-route decorators (`@limiter.limit("5/minute")`) replace manual dependency.
  - Rate limit settings env-configurable (`RATE_LIMIT_DEFAULT`, `REDIS_URL`, `RATE_LIMIT_ENABLED`).
  - Custom key function prioritizes `X-Real-IP` (authoritative from nginx/Cloudflare).
  - Per-user rate limiting for authenticated routes (stashes user on `request.state`).
  - Mirror endpoint limited to 10/minute per user.
  - `Retry-After` header on 429 responses.
- **Frontend 429 Notifications**: Added `sonner` toast notifications for rate limit responses.
  - Global toast in `api.ts` for all 429 responses.
  - Context-specific toasts in `AuthContext.tsx` for login/register/reset-password rate limits.
- **Feedback System** — collect user feedback via two entry points:
  - Full survey with 13 multi-step questions (visual card-style options, 2-column grid, no subtitles)
  - Short contextual survey modal triggered by session nudge (2nd+ login or 3+ days) and exit intent (>20s dwell, no edits)
  - Backend `POST /feedback` endpoint with Beanie document, rate-limited (5/min per user), stamps `app_version` server-side
  - `questionnaire_version: "1.0"` for tracking question set changes
  - `POST /feedback/dismiss` to record dismissed triggers per user
- **Admin Feedback Panel**:
  - `GET /feedback` (admin, paginated, filterable by variant/trigger)
  - `GET /feedback/summary` with counts, breakdowns, average feel score, headline retention/pricing stats
  - `AdminFeedbackView` frontend with Summary + Raw Responses tabs
- **APP_VERSION auto-set from git tag** — Makefile passes `GIT_TAG` to backend; CI injects via `-e APP_VERSION=$GIT_TAG`; no hardcoded fallback in docker-compose
- **Sidebar reorganization** — renamed "LLM Admin" to "Admin" (Shield icon), moved Settings + Admin below a separator, kept Help us improve at the bottom

### Tests & Code Quality
- **Backend auth tests expanded:** from 20 → 43 tests covering:
  - Login: non-existent email, Google-only account rejection (401)
  - Register: duplicate email (400), short password (422), mismatched passwords (400)
  - Token verify: expired JWT (401), tampered JWT (401), deleted user (401)
  - Get me: deactivated user (403)
  - Preferences: invalid mode/accent/fontSize (422), extra field ignored
  - New `test_logout.py`: valid token clears cookies, without token succeeds, auth state cleared
  - New `test_google_oauth.py`: mock service tests for redirect, invalid state, new user creation, existing email linking, returning user
- **Fixed docstring mismatches:** `test_verify_token_invalid` and `test_get_current_user_without_auth` said "returns 403" but assert 401 (correct)
- **Fixed frontend E2E fixture cookie paths:** `loginAsUser()` sets `access_token` with `path='/api/v0'` and `session_exists` with value `'1'` (matches backend)
- **Fixed frontend logout test:** added `toBeVisible()` assertion on confirm dialog before clicking (race condition fix)
- **Added frontend E2E tests:** invalid credentials error, session persistence on reload, Google Sign-In button presence, Forgot Password link, empty field validation, invalid email validation
- **Fixed pre-existing TS errors:** removed unused `isCurrentAuthSession` import in `ThemeContext.tsx`; replaced `session.token` check with `session.generation === 0` in `useJournalEntries.ts`

### Infrastructure
- Added `redis:7.4-alpine` to `docker-compose.yml` and `docker-compose.prod.yml`.

## [v0.2.0-alpha] - 2026-07-10

### Added & Fixed

#### Security & Access Control
- Implemented robust Role-Based Access Control (RBAC) across the full stack.
- Added an `admin` role to the MongoDB user document model.
- Created a `get_current_admin_user` FastAPI dependency to securely block standard users from accessing sensitive endpoints.
- Added conditional rendering to the frontend sidebar and route guards to strictly protect the Admin Dashboard from unauthorized access.

#### LLM Configuration & Admin Dashboard
- Migrated LLM provider configurations from static local JSON files to a MongoDB-backed `LLMProvider` collection.
- Implemented `LLMProviderRepository` to centralize database operations and ensure clean architecture.
- Optimized backend to cache the `LiteLLMClient` singleton using Python's `@lru_cache`, enabling zero-downtime hot-swaps.
- Added a mock LLM fallback to prevent crashes on fresh databases.
- Created a premium React Admin Dashboard enabling administrators to add, reorder, delete, and run parallel latency diagnostics on LLM deployments.
- Refactored REST routes to feature secure API key obfuscation on output and preservation on input to prevent credential leakage.
- Added a robust suite of 16 end-to-end tests covering all Admin endpoints and critical edge cases (e.g. empty databases, obfuscated key preservation).

#### UI/UX & Core Features
- Redesigned the main Journals view into a new modern timeline style.
- Resolved "Untitled" journal entry issues by implementing robust auto-generation fallback logic.
- Overhauled the offline saving and background sync architecture to permanently resolve state consistency and syncing problems.
- Fixed frontend sidebar alignment and various other small UI bugs.
- Updated the public landing page.

#### Navigation & Routing
- Integrated HTML5 browser history state with React views to fully support native back-button navigation on mobile phones.
- Implemented popstate safety checks to prevent accidental app exits when swiping back to the root page.
- Extended URL query parameter integration to support and preserve specific active chat sessions (`?view=chat&chat=<id>`).
- Refactored history navigation to a "Single Source of Truth" pattern using a custom `useRouter` hook.

#### Testing & CI
- Added GitHub Actions workflows for automated end-to-end (E2E) tests.
- Added GitHub Actions workflow for Playwright frontend UI tests.
- Added comprehensive backend integration tests.

## [v0.1.0-alpha] - 2026-07-05

### Added

#### Core
- Authentication system — register, login, JWT verification, password reset
- User preferences — per-user settings with partial update support
- Session-based rate limiting
- JWT-based auth with bcrypt password hashing

#### Journaling
- Journal CRUD — create, read, update, delete entries with title, content, tags
- Paginated listing with configurable page size
- Per-entry feeling indicator (negative to positive scale)

#### AI & Chat
- Mirror reflections — four modes (emotional, cognitive, behavioral, relational) via OpenRouter
- Real-time WebSocket chat with persistent storage, lazy creation, sliding-window context, and auto-generated titles
- Chat history sidebar for browsing and deleting past chats
- Rumination Gate — real-time detection of abstract loops, pivots to grounding prompts
- Chat-to-journal linking — "Chat about this entry" from journal view
- Mock LLM client for offline development and CI

#### User Model
- Per-entry rumination index stored on journal documents
- LLM-generated baseline profile (emotionalTone, thinkingStyle, selfFocus, confidence)
- Batch update pipeline auto-triggered on journal creation
- Context injection into chat and mirror prompts

#### Search
- Semantic search across journal entries

#### UI/UX
- Landing page with feature overview
- Dark/light theme with system preference detection
- Responsive layout with sidebar navigation, modals, mobile-friendly chat
- Persistent chat state across view switches
- Markdown rendering in chat messages

#### Infrastructure
- Docker compose for local dev and production
- nginx reverse proxy with WebSocket support
- GitHub Actions deploy pipeline
- Makefile for local dev commands
- Automated daily backups to Backblaze B2

#### Testing
- 74+ E2E tests covering auth, journals, AI reflections, chat, and user model
- Playwright frontend tests
- Mock LLM for deterministic test responses
