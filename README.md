# My Inner Pages - Backend

FastAPI backend with MongoDB for journaling app with authentication and AI-powered reflections.

## 🆕 Recent Updates

**Mirror Section - Daily Reflection**
The backend now includes AI-powered mirror reflections! Users can receive personalized insights based on their recent journal entries, with four different reflection modes to prevent repetition.

📖 See `MIRROR_IMPLEMENTATION.md` in the root directory for detailed implementation docs.

## Quick Start

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Structure

```
app/
├── auth/              # Authentication module
│   ├── api/v0/routes/ # Auth endpoints
│   ├── db/            # User model & repository
│   └── facade/        # Business logic
├── journals/          # Journals module (user-specific)
│   ├── api/v0/routes/ # Journal endpoints (JWT required)
│   ├── db/            # Journal model (with user_id) & repository
│   └── facade/        # Business logic
├── ai/                # AI module (NEW!)
│   ├── api/v0/routes/ # Mirror reflection endpoints
│   └── services/      # LLM integration & mirror logic
├── memory/            # Memory module (NEW!)
│   └── service.py     # Context retrieval for AI
└── core/              # Shared services
    ├── services/      # JWT, password hashing
    └── deps/          # Auth dependencies (get_current_user)
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
MONGO_URL=mongodb://localhost:27017
DATABASE_NAME=journaling_app
JWT_SECRET_KEY=change-in-production
OPENROUTER_API_KEY=your-openrouter-api-key  # Required for AI features
```

See `.env.example` for a complete example.

## Tech Stack

- FastAPI - Web framework
- MongoDB + Beanie - Database
- PyJWT - JWT tokens
- Bcrypt - Password hashing
- Pydantic - Validation
- httpx - HTTP client for LLM API calls
- OpenRouter - LLM provider (supports multiple models)

## API Docs

http://localhost:8000/docs
