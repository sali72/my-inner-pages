# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

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
