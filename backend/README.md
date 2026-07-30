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
│   ├── api/           # REST endpoints (list, get, delete)
│   ├── facade.py      # ChatPersistenceFacade
│   └── history_manager.py  # Sliding-window history
├── ai/                # AI features
│   ├── integrations/  # LLM clients (OpenRouter, Mock)
│   ├── prompts/       # LangChain prompt templates
│   ├── services/      # Mirror + Chat business logic
│   └── api/routes/    # REST endpoints
├── memory/            # User model + context injection for AI
│   ├── db/            # UserModel document + repository
│   ├── prompts/       # Update + context injection prompts
│   └── user_model_updater.py  # Background updates
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

## Email Service (Resend)

Verification and transactional emails are sent via [Resend](https://resend.com) from `support@innerpages.ir`.

### Setup
1. Create a Resend account and verify your domain (`innerpages.ir`)
2. Set `RESEND_API_KEY=re_your-api-key` in `.env`
3. Emails from `support@innerpages.ir` are automatically configured with Resend's DKIM/SPF

### Disable verification for testing
Set `EMAIL_VERIFICATION_REQUIRED=false` in `.env` to skip email verification and auto-verify users on registration.

## API Endpoints

### REST
- **Auth** (`/api/v0/auth`) — register, login, me, verify, verify-email, resend-verification
- **Journals** (`/api/v0/journals`) — CRUD (JWT required)
  - `GET /journals?tags=growth&tags=personal&tag_mode=and` — filter by tags (OR/AND)
- **Tags** (`/api/v0/tags`) — tag registry management (JWT required)
  - `GET /tags?q=gro&limit=10` — prefix search for autocomplete
  - `GET /tags/all` — all tags with usage counts and colors
  - `PUT /tags/{name}` — rename tag across all journals
  - `PATCH /tags/{name}` — update tag metadata (color)
  - `DELETE /tags/{name}` — delete tag from all journals
- **Mirror** (`/api/v0/mirror`) — AI reflections (JWT required)
  - `GET /reflection?mode=emotional|cognitive|behavioral|relational`
- **Memory** (`/api/v0/memory`) — user model (dev only)
  - `POST /update-user-model` — manual LLM re-build
  - `GET /user-model` — inspect current model
- **Chats** (`/api/v0/chats`) — persistent chat storage (JWT required)
  - `GET /chats` — list chats (paginated, `?page=1&page_size=50`)
  - `GET /chats/{chat_id}` — get single chat with full messages
  - `DELETE /chats/{chat_id}` — delete a chat

### SSE Streaming
- **Chat** (`POST /api/v0/chat/stream`) — stream AI chat responses via Server-Sent Events

  **Request:** `{ "content": "...", "chat_id": "<id>", "message_id": "<uuid>", "edit_message_index": <int> }`
  **Events:** `context_loaded` → `ack` → `token`* → `done` | `error`

  Authenticated via HttpOnly `access_token` cookie. Cancel by aborting the HTTP request.

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
