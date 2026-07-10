# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

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
