# My Inner Pages - Backend

FastAPI backend with MongoDB for journaling app with authentication and AI-powered reflections.

## 🆕 Recent Refactoring

**Architecture Improvements:**
- ✅ **Dependency Injection** - FastAPI native DI across all modules
- ✅ **Session Per Request** - Each request gets its own MongoDB session via context variable
- ✅ **Transaction Support** - ACID guarantees for critical operations
- ✅ **Error Handling** - Custom exceptions with comprehensive logging
- ✅ **Settings Singleton** - Cached settings for better performance

**Key Pattern:**
```python
# Each route gets a session automatically
@router.post("/journals", dependencies=[Depends(get_db)])
async def create_journal(...):
    # Session available via get_current_session()
    journal = await repository.create(...)
```

## Quick Start

### Using uv (Recommended - Fast!)

```bash
# Install uv if you haven't already
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install dependencies
uv sync

# Run the app
uv run fastapi dev app/main.py
```

### Alternative: Using pip

```bash
pip install -e .
uvicorn app.main:app --reload
```

## Structure

```
app/
├── auth/              # Authentication module
│   ├── api/v0/routes/ # Auth endpoints
│   ├── db/            # User model & repository
│   ├── facade/        # Business logic
│   └── deps.py        # Auth dependencies
├── journals/          # Journals module
│   ├── api/v0/routes/ # Journal endpoints (JWT required)
│   ├── db/            # Journal model & repository
│   ├── facade/        # Business logic
│   └── deps.py        # Journal dependencies
├── ai/                # AI module
│   ├── api/v0/routes/ # Mirror reflection endpoints
│   ├── services/      # LLM & mirror services
│   └── deps.py        # AI dependencies
├── memory/            # Memory module
│   ├── service.py     # Context retrieval
│   └── deps.py        # Memory dependencies
└── core/              # Shared core
    ├── services/      # JWT, password hashing
    ├── deps/          # Database, settings, auth
    ├── exceptions.py  # Custom exceptions
    └── transactions.py # Transaction support
```

## API Endpoints

### Auth (`/api/v0/auth`)
- `POST /register` - Register user
- `POST /login` - Login (returns JWT)
- `GET /me` - Get current user
- `GET /verify` - Verify token
- `POST /reset-password` - Request password reset

### Journals (`/api/v0/journals`) - All require JWT
- `POST /` - Create journal (user-specific)
- `GET /` - List user's journals (paginated)
- `GET /{id}` - Get user's journal
- `PUT /{id}` - Update user's journal
- `DELETE /{id}` - Delete user's journal

### Mirror (`/api/v0/mirror`) - All require JWT (NEW!)
- `GET /reflection` - Generate personalized AI reflection
  - Query param: `mode` (emotional, cognitive, behavioral, relational)

## Configuration (.env)

```env
# MongoDB (replica set required for transactions)
MONGO_URL=mongodb://localhost:27017/?replicaSet=rs0
DATABASE_NAME=journaling_app

# Auth
JWT_SECRET_KEY=change-in-production

# AI Features
OPENROUTER_API_KEY=your-openrouter-api-key
```

**Note:** For transactions to work, MongoDB must be configured as a replica set:
```bash
mongod --replSet rs0
mongo --eval "rs.initiate()"
```

See `.env.example` for a complete example.

## Tech Stack

- **uv** - Fast Python package manager
- **FastAPI** - Web framework
- **MongoDB + Beanie** - Database
- **PyJWT** - JWT tokens
- **Bcrypt** - Password hashing
- **Pydantic** - Validation
- **httpx** - HTTP client for LLM API calls
- **OpenRouter** - LLM provider (supports multiple models)

## Development

### Running Tests

```bash
uv run pytest
```

### Adding Dependencies

```bash
# Add a production dependency
uv add package-name

# Add a dev dependency
uv add --dev package-name

# Update dependencies
uv sync
```


## API Docs

http://localhost:8000/docs
