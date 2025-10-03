# Note Taking API

AI-boosted Journaling app with focus on self-knowledge.

## Setup

1. Install dependencies:
```bash
poetry install
```

2. Create `.env` file:
```env
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=journaling_app
```

3. Run the application:
```bash
poetry run uvicorn app.main:app --reload
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure

- `app/core/` - Shared infrastructure (config, database, dependencies)
- `app/journals/` - Journal module with layered architecture
  - `api/v0/` - REST endpoints and schemas
  - `facade/` - Business logic layer
  - `db/` - Data access layer (models, repository)
