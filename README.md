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
├── ai/                # AI features
│   ├── integrations/  # LLM clients (OpenRouter, Mock)
│   ├── prompts/       # LangChain prompt templates
│   ├── services/      # Mirror + Chat business logic
│   ├── ws/            # WebSocket infrastructure (ConnectionManager)
│   └── api/v0/routes/ # REST + WebSocket endpoints
├── memory/            # Journal context retrieval for AI
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
```

See `.env.example` for all options.

## API Endpoints

### REST
- **Auth** (`/api/v0/auth`) — register, login, me, verify
- **Journals** (`/api/v0/journals`) — CRUD (JWT required)
- **Mirror** (`/api/v0/mirror`) — AI reflections (JWT required)
  - `GET /reflection?mode=emotional|cognitive|behavioral|relational`

### WebSocket
- **Chat** (`/api/v0/chat/ws?token=<jwt>`) — real-time AI chat with journal memory

  **Protocol:**
  1. Client connects with JWT in query param
  2. Server sends `{"type": "context_loaded"}` after fetching journal context
  3. Client sends `{"type": "message", "content": "..."}`
  4. Server streams response tokens: `{"type": "token", "content": "..."}`
  5. Server signals completion: `{"type": "done"}`

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
