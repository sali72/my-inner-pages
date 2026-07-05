# My Inner Pages — Backend

Python 3.11+ FastAPI server with MongoDB/Beanie, LangChain AI, JWT auth.

## Commands (run from `backend/`)
- `uv sync` — install dependencies
- `uv run fastapi dev app/main.py` — dev server with hot reload
- `uv run pytest` — run all tests (async, isolated test DB)
- `uv run pytest tests/E2E/auth/ -v` — run specific test module
- `uv add <package>` — add dependency

## Non-obvious tooling
- `uv` instead of pip — Rust-based package manager, uses `uv.lock`
- `hatchling` as build backend
- `structlog` for structured logging (key-value pairs)

## Architecture
- **Domain modules:** `auth/`, `journals/`, `chat/`, `ai/`, `memory/`
- **Shared infra:** `core/` (config, logging, middleware, rate-limit, cache, deps)
- **Layer pattern per module:** `api/v0/routes/` → `facade/` or `service/` → `db/repository.py`
- **DI:** Routes use `Depends(get_*)` — never instantiate services directly
- **Route prefix:** `/api/v0` set in `main.py`

## Key conventions
- **Type hints:** mandatory on all function signatures
- **Docstrings:** Google-style with Args/Returns/Raises
- **Logging:** `structlog.get_logger(__name__)`, key-value pairs
- **Responses:** Pydantic schemas with `from_document()` classmethod
- **Errors:** facades raise `ValueError`; routes catch → `HTTPException`
- **Imports:** stdlib → third-party → local (absolute from `app.`)
- **Testing:** async tests (`@pytest.mark.asyncio`), fresh test DB per test, mock LLM enforced

## AI-specific notes
- `USE_MOCK_LLM=true` in `.env` for offline dev — avoids API costs
- Test suite auto-enables mock LLM via conftest fixture overrides
- LLM client selected via `get_llm_client()` dependency in `ai/deps.py`

## Boundaries
- Do NOT commit `.env` files or real API keys
- Do NOT use synchronous PyMongo — use async Motor
- Do NOT bypass `get_current_user()` — always validate auth
- Do NOT hardcode secrets — use `Settings` from pydantic-settings
