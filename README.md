# My Inner Pages - Backend

FastAPI backend with MongoDB for journaling app with authentication and AI-powered reflections.

## Quick Start

```bash
# Install dependencies
uv sync

# Run the app
uv run fastapi dev app/main.py
```

## Structure

```
app/
├── auth/              # Authentication (JWT)
├── journals/          # Journal CRUD (user-specific)
├── ai/                # AI features
│   ├── integrations/  # LLM clients (LangChain, Mock)
│   ├── prompts/       # LangChain templates
│   ├── services/      # Business logic
│   └── config.py      # AI module config
├── memory/            # Context retrieval
└── core/              # Shared (DB, settings, auth)
```

## Configuration (.env)

```env
# MongoDB (replica set required for transactions)
MONGO_URL=mongodb://localhost:27017/?replicaSet=rs0
DATABASE_NAME=journaling_app

# Auth
JWT_SECRET_KEY=change-in-production

# AI Features
OPENROUTER_API_KEY=your-key
USE_MOCK_LLM=false  # true for testing without API calls
```

See `.env.example` for all options.

## API Endpoints

- **Auth** (`/api/v0/auth`) - register, login, me, verify
- **Journals** (`/api/v0/journals`) - CRUD (JWT required)
- **Mirror** (`/api/v0/mirror`) - AI reflections (JWT required)
  - `GET /reflection?mode=emotional|cognitive|behavioral|relational`

## Tech Stack

- **FastAPI** - Web framework
- **MongoDB + Beanie** - Database
- **LangChain** - LLM integration
- **OpenRouter** - LLM provider

## Development

```bash
# Tests
uv run pytest

# Add dependencies
uv add package-name
```

Docs: http://localhost:8000/docs
