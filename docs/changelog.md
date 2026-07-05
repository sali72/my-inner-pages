# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

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
