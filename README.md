# My Inner Pages - Backend

FastAPI backend with MongoDB for journaling app with authentication, AI-powered reflections, and real-time AI chat.

## Quick Start

```bash
# Install dependencies
uv sync

# Run the app (with mock AI — no API key needed)
USE_MOCK_LLM=true uv run fastapi dev app/main.py

# Or point to a local Ollama instance
# LLM_BASE_URL=http://localhost:11434/v1 LLM_MODEL=llama3.2 uv run fastapi dev app/main.py
```

## Structure

```
app/
├── auth/              # Authentication (JWT)
├── journals/          # Journal CRUD (user-specific)
├── chat/              # Chat persistence
│   ├── db/            # Chat Beanie document + repository
│   ├── api/v0/        # REST endpoints (list, get, delete)
│   ├── service.py     # ChatPersistenceService
│   └── history_manager.py  # Sliding-window history
├── ai/                # AI features
│   ├── integrations/  # LLM clients (OpenRouter, Mock)
│   ├── prompts/       # LangChain prompt templates
│   ├── services/      # Mirror + Chat business logic
│   ├── ws/            # WebSocket infrastructure (ConnectionManager)
│   └── api/v0/routes/ # REST + WebSocket endpoints
├── memory/            # User model + context injection for AI
│   ├── db/            # UserModel document + repository
│   ├── prompts/       # Update + context injection prompts
│   └── services/      # UserModelUpdater (background)
└── core/              # Shared (DB, settings, JWT, rate-limit)
```

## Configuration (.env)

```env
# MongoDB (replica set required for transactions)
MONGO_URL=mongodb://localhost:27017/?replicaSet=rs0
DATABASE_NAME=journaling_db

# Auth
JWT_SECRET_KEY=change-in-production

# AI — pick one target:
USE_MOCK_LLM=true              # fake responses, no deps needed
# LLM_BASE_URL=http://localhost:11434/v1 LLM_MODEL=llama3.2  # Ollama
# OPENROUTER_API_KEY=your-key LLM_BASE_URL=https://openrouter.ai/api/v1  # OpenRouter

# Memory (user model)
# MEMORY_UPDATE_AFTER_ENTRIES=5    # trigger update every N entries
# MEMORY_UPDATE_AFTER_WORDS=5000   # or every N words
```

See `.env.example` for all options.

## API Endpoints

### REST
- **Auth** (`/api/v0/auth`) — register, login, me, verify
- **Journals** (`/api/v0/journals`) — CRUD (JWT required)
- **Mirror** (`/api/v0/mirror`) — AI reflections (JWT required)
  - `GET /reflection?mode=emotional|cognitive|behavioral|relational`
- **Memory** (`/api/v0/memory`) — user model (dev only)
  - `POST /update-user-model` — manual LLM re-build
  - `GET /user-model` — inspect current model
- **Chats** (`/api/v0/chats`) — persistent chat storage (JWT required)
  - `GET /chats` — list chats (paginated, `?page=1&page_size=50`)
  - `GET /chats/{chat_id}` — get single chat with full messages
  - `DELETE /chats/{chat_id}` — delete a chat

### WebSocket
- **Chat** (`/api/v0/chat/ws?token=<jwt>[&chat_id=<id>]`) — real-time AI chat with persistence

  **Protocol:**
  1. Connect with JWT (optional `chat_id` to resume an existing chat)
  2. Server sends `{"type": "context_loaded", "chat_id": string|null}`
  3. Client sends `{"type": "message", "content": "..."}
  4. Server streams response tokens: `{"type": "token", "content": "..."}`
  5. Server signals completion: `{"type": "done"}` (includes `chat_id` on first response of a new chat)

## Tech Stack

- **FastAPI** + **Uvicorn** — Web framework
- **MongoDB + Beanie** — Database (ODM)
- **LangChain** — LLM integration (OpenAI-compatible)
- **OpenRouter / Ollama** — LLM providers

## Development

```bash
# Tests
uv run pytest

# Add dependencies
uv add package-name
```

Docs: http://localhost:8000/docs
