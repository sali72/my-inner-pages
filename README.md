# My Inner Pages - Frontend

React + TypeScript journaling app with authentication and AI-powered reflections.

## Quick Start

```bash
npm install
npm run dev
```

## Structure

```
src/
├── components/
│   ├── landing/       # Landing page (pre-auth)
│   ├── auth/          # Authentication (Login, Register, etc)
│   ├── journal/       # Journal entries, pages, tags
│   ├── chat/          # AI Chat (ChatView, ChatHistorySidebar, MarkdownRenderer)
│   ├── mirror/        # AI reflection feature
│   ├── settings/      # User settings
│   ├── layout/        # Header, Sidebar
│   └── common/        # Reusable components (DropdownMenu, IconButton)
├── contexts/          # React contexts (AuthContext)
├── hooks/             # Custom hooks (useJournalEntries, useChatWebSocket, useSettings, usePageFlip)
├── constants/         # Theme & mirror mode configs
├── types/             # TypeScript types (includes chat types)
└── utils/             # Helpers (theme, errorHandler, fonts, textDirection, api)
```

## Configuration (Environment Variables)

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000/api/v0` | Backend API base URL |
| `VITE_WS_URL` | `ws://localhost:8000/api/v0` | WebSocket endpoint |
| `VITE_SENTRY_DSN` | *(empty)* | Sentry DSN for error monitoring (optional) |
| `VITE_ENV` | `development` | Environment label (`development`, `production`) |
| `VITE_APP_VERSION` | `0.1.0` | App version label |

For local dev, create `frontend/.env` (see `.env.example`). For production, new vars must be added to:
1. `frontend/Dockerfile` — as `ARG` + `ENV`
2. `.github/workflows/deploy-vps.yml` — in the `env:` block and `--build-arg`
3. GitHub repo Secrets if the value is sensitive

To add a new variable in production (e.g. `VITE_SENTRY_DSN`), you must also create a corresponding secret in **GitHub → Settings → Secrets and variables → Actions** with the same name.

## Features

- **Landing Page** - Calm, reflective pre-auth page with app overview
- **Authentication** - Login/Register (no email verification)
- **Journal** - Entries with tags, page flip animations
- **Journal Navigation** - Right sidebar with search, sort, and filter capabilities
  - Access via list icon in top-right corner (journal section only)
  - Real-time search across titles and content
  - Sort by date (newest/oldest) or title (A-Z/Z-A)
  - Multi-select tag filtering
  - Click any entry to jump directly to that page
  - Visual highlighting of current journal
  - Closes when clicking outside sidebar
- **AI Chat** - Real-time WebSocket chat with the AI. Conversations persisted
  (survive sessions), browsable via right sidebar. Lazy-created on first message.
  Auto-title from first user message. Auto-reconnect with exponential backoff
  on disconnection. Per-message delivery status (sending/delivered/failed/queued).
  Connection state indicator. Cancel streaming without disconnecting. Resumes
  interrupted generations on reconnect. Access via list icon in top-right corner
  (chat section). Preserved across view switches within a session.
- **Mirror** - AI reflections in 4 modes (emotional, cognitive, behavioral, relational)
- **Themes** - Vintage, minimal, dark
- **Settings** - Font, size, theme, ambient sound

## Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS
- Lucide Icons

## Testing

### End-to-End Tests (Playwright)

```bash
npm run test:e2e
```

6 E2E tests covering auth flow (register, login, logout) and journal CRUD (create, edit, delete).

**Setup:**
1. Backend must be running on `localhost:8000` (MongoDB too)
2. `npm install` (Playwright browsers are installed via `postinstall`)
3. `npm run test:e2e` starts Vite dev server automatically, then runs tests

**Convention:** All selectors use visible text, aria-labels, or semantic roles — no test IDs.

## Architecture

Single-page app with feature-based organization. Auth state via Context API. No routing - conditional rendering based on authentication state and view state (`journal` | `mirror` | `settings`).

**User Flow:**
1. Unauthenticated users see landing page
2. Click "Start Writing" → Login/Register
3. After auth → Main app with journal view
4. Can return to landing via "Back to landing" link on auth pages
