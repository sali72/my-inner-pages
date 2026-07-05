# My Inner Pages

AI-powered private journaling app. Backend: FastAPI + MongoDB. Frontend: React + Vite.

## Root-level commands
- `make backend` — start backend dev server (uvicorn --reload)
- `make frontend` — start frontend dev server (Vite, port 5173)
- `make run` — start both backend and frontend concurrently
- `make stop` — kill both processes
- `docker compose up` — full-stack Docker (dev)
- `docker compose -f docker-compose.prod.yml up` — production stack

## Repo layout
- `backend/` — FastAPI API server → see `backend/AGENTS.md`
- `frontend/` — React SPA → see `frontend/AGENTS.md`

## General conventions
- Commit messages: imperative mood, scope-prefixed (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`)
- Squash-merge PRs to `main`
- Never commit `.env` files, secrets, or credentials
- Lockfiles (`package-lock.json`, `uv.lock`) committed on dependency changes
- Keep `AGENTS.md` files updated alongside code changes in the same PR
