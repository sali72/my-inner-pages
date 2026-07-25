# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
│  React + TypeScript + Vite + Tailwind CSS                  │
│  - Context API for auth state                              │
│  - Custom hooks for features                               │
│  - Single-page app (no routing)                            │
│  - Local-first editor: Yjs + y-indexeddb + Tiptap          │
└──────────────────┬──────────────────────────────────────────┘
                   │ HTTP/JSON
                   │ JWT Authentication
┌──────────────────▼──────────────────────────────────────────┐
│                     Backend API                             │
│  FastAPI + Python 3.11+                                     │
│  - RESTful API with OpenAPI docs                           │
│  - JWT token authentication                                │
│  - Dependency injection pattern                            │
└──────────────────┬──────────────────────────────────────────┘
                   │ Motor (async driver)
                   │ Beanie ODM
┌──────────────────▼──────────────────────────────────────────┐
│                      MongoDB                                │
│  - User documents (credentials, profile, preferences)      │
│  - Journal documents (entries with tags array)            │
│  - Tag documents (registry: name, usage_count, color)     │
│  - Chat documents (messages, metadata, linked entries)     │
│  - UserModel documents (psychological profile)             │
│  - Replica set for transactions                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   External Services                         │
│  OpenRouter API - LLM services for AI reflections          │
└─────────────────────────────────────────────────────────────┘
```

## Backend Layers

### 1. API Layer (`api/routes/`)
- Thin route handlers
- Request/response validation
- HTTP status code mapping
- Delegates to facade layer

### 2. Facade Layer (`facade/`)
- Business logic orchestration
- Coordinates multiple repositories
- Handles transactions
- Converts exceptions to domain errors

### 3. Repository Layer (`db/repository.py`)
- Database operations only
- Uses Beanie ODM
- Session management
- Returns domain models

### 4. Service Layer (`services/`)
- Cross-cutting concerns
- JWT token management
- Password hashing
- LLM API communication

## Frontend Architecture

### Component Structure
```
App (root)
├── AuthContainer (when not authenticated)
│   ├── LoginPage
│   ├── RegisterPage
│   └── ForgotPasswordPage
└── Authenticated App (when logged in)
    ├── Header
    │   └── List button toggles JournalNavigationSidebar or ChatHistorySidebar
    ├── Sidebar (navigation menu)
    └── Main Content
        ├── JournalView (activeView === 'journal')
        │   ├── JournalPage (editor with tag autocomplete, colored pills)
        │   ├── JournalTimeline (entry cards with tag filters, AND/OR toggle)
        │   ├── TagManager (modal: browse, rename, delete, color picker, cloud view)
        │   └── JournalNavigationSidebar (right overlay)
        ├── MirrorView (activeView === 'mirror')
        ├── ChatView (always mounted, hidden via CSS when not active)
        │   ├── SSE HTTP POST stream to /api/v0/chat/stream
        │   ├── Message list with Markdown rendering
        │   ├── Message actions (copy, edit, regenerate)
        │   └── ChatHistorySidebar (right overlay)
        └── SettingsView (activeView === 'settings')
```

### State Management
- **Global State**: AuthContext (user, login, logout)
- **Feature State**: Custom hooks (useJournalEntries, useSettings, usePageFlip, useChatStream)
  - useChatStream manages SSE streaming state, AbortController cancellation, and message delivery status
- **Local Storage**: Auth token (cache), theme preferences (cache with server sync)
- **Editor State**: Y.Doc per journal entry, persisted to IndexedDB via y-indexeddb (local source of truth)

## Data Flow

### Journal Editing Flow
```
Local-first (authoritative):
1. User types → Tiptap Editor → Y.Doc shared types
2. y-indexeddb persists to IndexedDB immediately (local source of truth)
3. Optional: debounced save() → PUT /journals/{id} (best-effort backend sync)

Offline draft:
1. Create fails (offline) → draft-{timestamp} ID generated locally
2. Entry saved to IndexedDB (Y.Doc) + localStorage (sync queue)
3. Background sync (on online/focus/30s polling) → POST /journals → receives real ID
4. URL param swapped → component remounts with real database
```

### Background Sync Flow
```
App.tsx monitors:
- navigator.onLine event
- window focus event
- 30-second polling interval (setInterval) — retries pending syncs periodically

When triggered:
1. Reads unsynced entries from localStorage
2. For draft- entries: POST /journals (create on backend)
3. For existing entries: PUT /journals/{id} (update on backend)
4. On success: dispatch journal:id-migrated event, remove from localStorage
5. On failure: log error, retry on next cycle
```

### Tag Flow
```
Tags follow a hybrid embedded+registry model:

1. **On journal create/update/delete** → JournalFacade syncs Tag registry:
   - Upsert: increment usage_count or create Tag document
   - Remove: decrement usage_count; delete if 0
   - Replace: diff old vs new tags, apply upsert/remove

2. **Tag display**:
   - Timeline: entry cards show up to 2 tags with overflow +N
   - Editor: colored pills with remove button, #hashtag autocomplete
   - Filter panel: toggle buttons with OR/AND mode, colors from registry

3. **Tag management** (TagManager modal):
   - Browse all tags with usage_counts and colors
   - Rename → PUT /tags/{name} (updates registry + all journal documents)
   - Delete → DELETE /tags/{name} (removes registry + pulls from journals)
   - Color → PATCH /tags/{name} { "color": "#e74c3c" }
   - Cloud view: tags sized by usage_count

4. **API endpoints**:
   - GET  /tags?q=&limit=    — prefix search for autocomplete
   - GET  /tags/all          — all tags with usage_count + color
   - PUT  /tags/{name}       — rename tag (updates all journals)
   - PATCH /tags/{name}      — update tag metadata (color)
   - DELETE /tags/{name}     — delete tag (removes from all journals)
```

### Preferences Flow
```
1. User changes setting → ThemeContext setter
2. localStorage updated immediately (instant response)
3. Debounced (400ms) PUT /auth/me/preferences → Backend
4. Backend → Route validates → Facade merges → Repository $set
5. On page load: GET /auth/me returns preferences
6. ThemeContext merges server preferences with local cache
```

### AI Reflection Flow
```
1. User clicks Mirror → MirrorView
2. Select mode → API call with mode parameter
3. Backend → Memory service fetches recent journals
4. LLM service → Formats context → Calls OpenRouter API
5. Response → Streams back to frontend
6. UI displays reflection
```

### Chat Flow
```
1. User opens Chat view → ChatView mounts
2. User types message → sendMessage() sends POST to /api/v0/chat/stream with Authorization Bearer header
3. Server receives request, validates user, loads/creates chat, and streams SSE events (text/event-stream)
4. Server emits context_loaded, ack, and streams LLM tokens (event: token)
5. Stream completes → backend persists assistant message → frontend receives event: done
6. If user clicks "Stop" → AbortController cancels the HTTP POST stream natively
7. Chat list loaded via REST GET /chats for sidebar
8. User can browse history via ChatHistorySidebar (right overlay, REST-backed)
```

## Key Design Patterns

### Dependency Injection (Backend)
```python
# Routes declare dependencies via Depends()
@router.post("/journals", dependencies=[Depends(get_db)])
async def create_journal(
    facade: JournalFacade = Depends(get_journal_facade),
    user: User = Depends(get_current_user)
):
    # Dependencies automatically injected
    return await facade.create_journal(...)
```

### Session Per Request (Backend)
- Each HTTP request gets its own MongoDB session
- Stored in context variable (thread-safe)
- Automatic cleanup after response
- Transaction support when needed

### Context + Hooks (Frontend)
```typescript
// AuthContext provides global auth state
const { user, login, logout } = useAuth();

// Custom hooks encapsulate feature logic
const { entries, addEntry, updateEntry } = useJournalEntries();
```

## Security Model

### Authentication
- Bcrypt password hashing (salt rounds: 12)
- JWT tokens (HS256 algorithm)
- Token stored in localStorage
- Included in Authorization header

### Authorization
- User ID embedded in JWT token
- All journal operations scoped to user
- Repository layer enforces user ownership
- No cross-user data access

### Data Protection
- No sensitive data in logs
- CORS configured for all origins (simplicity)
- Environment variables for secrets
- MongoDB connection string not exposed

## Scalability Considerations

### Current Scale (MVP)
- Single MongoDB instance with replica set
- Stateless FastAPI backend (horizontal scaling ready)
- Static frontend (CDN-ready)
- Suitable for: 100s-1000s users

### Future Scaling
- **Database**: MongoDB sharding by user_id
- **Backend**: Load balancer + multiple instances
- **Caching**: Redis for session/token cache
- **Storage**: S3 for media attachments
- **AI**: Queue system for async reflections

## Technology Choices Rationale

### Why FastAPI?
- Async/await native support
- Automatic OpenAPI documentation
- Built-in validation with Pydantic
- High performance

### Why MongoDB?
- Flexible schema for evolving journal structure
- Native array support (tags)
- Good for document-based data
- Easy aggregation for AI context

### Why Yjs for Editor State?
- CRDT-based conflict resolution (future multi-tab/collaboration)
- Official Tiptap integration via `@tiptap/extension-collaboration`
- Offline-first: persists to IndexedDB via y-indexeddb
- No custom sync protocol needed — Y.Doc is the single source of truth

### Why React without Router?
- Simple single-page flow
- Reduced bundle size
- No URL management complexity
- Faster initial load

### Why uv for Python?
- 10-100x faster than pip
- Better dependency resolution
- Modern lock file format
- Growing adoption

## Development Workflow

### Local Development
```bash
# Backend: Hot reload with FastAPI dev
uv run fastapi dev app/main.py

# Frontend: Vite dev server with HMR
npm run dev

# MongoDB: Local replica set
mongod --replSet rs0
```

### Testing
```bash
# Backend: E2E tests with pytest
uv run pytest

# Frontend: E2E tests with Playwright
npm run test:e2e
```

### Deployment
```bash
# Docker Compose for full stack
docker-compose up

# Or deploy separately
# - Frontend: Static hosting (Vercel, Netlify)
# - Backend: Container platform (Railway, Fly.io)
# - MongoDB: Atlas or self-hosted
```
