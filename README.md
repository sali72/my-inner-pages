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
├── journals/          # Journals module
│   ├── api/v0/routes/ # Journal endpoints
│   ├── db/            # Journal model & repository
│   └── facade/        # Business logic
└── core/              # Shared services
    ├── services/      # JWT, password hashing
    └── deps/          # Auth dependencies
```

## API Endpoints

### Auth (`/api/v0/auth`)
- `POST /register` - Register user
- `POST /login` - Login (returns JWT)
- `GET /me` - Get current user
- `GET /verify` - Verify token
- `POST /reset-password` - Request password reset

### Journals (`/api/v0/journals`)
- `POST /` - Create journal
- `GET /` - List journals (paginated)
- `GET /{id}` - Get journal
- `PUT /{id}` - Update journal
- `DELETE /{id}` - Delete journal

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
