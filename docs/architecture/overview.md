# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
│  React + TypeScript + Vite + Tailwind CSS                  │
│  - Context API for auth state                              │
│  - Custom hooks for features                               │
│  - Single-page app (no routing)                            │
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
│  - Journal documents (entries with tags)                   │
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

### 1. API Layer (`api/v0/routes/`)
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
        │   └── JournalNavigationSidebar (right overlay)
        ├── MirrorView (activeView === 'mirror')
        ├── ChatView (always mounted, hidden via CSS when not active)
        │   ├── WebSocket connection to /api/v0/chat/ws
        │   ├── Message list with Markdown rendering
        │   ├── Message actions (copy, edit, regenerate)
        │   └── ChatHistorySidebar (right overlay)
        └── SettingsView (activeView === 'settings')
```

### State Management
- **Global State**: AuthContext (user, login, logout)
- **Feature State**: Custom hooks (useJournalEntries, useSettings, usePageFlip)
- **Local Storage**: Auth token (cache), theme preferences (cache with server sync)

## Data Flow

### Journal Creation Flow
```
1. User fills form → JournalPage component
2. Submit → useJournalEntries hook
3. API call → api.post('/journals', data)
4. Backend → Route validates → Facade creates → Repository saves
5. Response → Update local state → UI reflects new entry
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
1. User opens Chat view → ChatView mounts (via CSS hidden → visible)
2. useChatWebSocket hook connects WebSocket:
   - No chat_id → server sends context_loaded with chat_id: null
   - Existing chat_id → server sends context_loaded with chat_id
3. User types message → sendMessage() via WebSocket
4. Backend persists user message to MongoDB (creates chat if first msg)
5. Backend streams LLM tokens → frontend renders via MarkdownRenderer
6. Stream completes → backend persists assistant message → frontend receives done
7. Chat list loaded via REST GET /chats for sidebar
8. User can switch views → ChatView stays mounted (hidden), WebSocket stays open
9. User can browse history via ChatHistorySidebar (right overlay, REST-backed)
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

# Frontend: Manual testing (E2E framework TBD)
npm run dev
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
