# My Inner Pages - Backend

FastAPI backend with MongoDB for journaling app with authentication.

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

## Configuration (.env)

```env
MONGO_URL=mongodb://localhost:27017
DATABASE_NAME=journaling_app
JWT_SECRET_KEY=change-in-production
```

## Tech Stack

- FastAPI - Web framework
- MongoDB + Beanie - Database
- PyJWT - JWT tokens
- Bcrypt - Password hashing
- Pydantic - Validation

## API Docs

http://localhost:8000/docs
