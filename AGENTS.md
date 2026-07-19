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

## Error monitoring (Sentry)
- DSN configured via `SENTRY_DSN` env var (optional — if empty, Sentry is a no-op)
- Initialized in `app/main.py` via `app/core/error_monitoring.py`
- `init_sentry()` with FastAPI/Starlette integrations, configurable `traces_sample_rate` and `profiles_sample_rate`
- Tags every event with `container_id` (for blue/green debugging) and `hostname`
- Global 5xx exception handler in `main.py` captures request context (method, URL, client IP, query string) to Sentry
- MongoDB connection retry exhaustion sends a Sentry event before raising
- Slow requests (>5s) are reported as Sentry warnings from `RequestLoggingMiddleware`
- `capture_exception()` utility in `error_monitoring.py` for manual reporting of handled-but-worthy errors
- Development: Sentry is disabled locally unless `SENTRY_DSN` is set; use `sentry-sdk`'s no-op behavior

## Key conventions
- **Type hints:** mandatory on all function signatures
- **Docstrings:** Google-style with Args/Returns/Raises
- **Logging:** `structlog.get_logger(__name__)`, key-value pairs
- **Responses:** Pydantic schemas with `from_document()` classmethod
- **Errors:** facades raise `ValueError`; routes catch → `HTTPException`
- **Imports:** stdlib → third-party → local (absolute from `app.`)
- **Testing:** async tests (`@pytest.mark.asyncio`), fresh test DB per test, mock LLM enforced
- **Routes are glue:** authenticate, validate, call a facade/service, translate errors — no business logic, no orchestration
- **Facade vs Service:** a *facade* owns business logic (orchestration + domain rules); a *service* holds reusable functionality that is not specific to a single business flow (helpers, cross-cutting concerns). If it orchestrates multiple steps or enforces domain rules, it belongs in a facade.

## AI-specific notes
- `USE_MOCK_LLM=true` in `.env` for offline dev — avoids API costs
- Test suite auto-enables mock LLM via conftest fixture overrides
- LLM client selected via `get_llm_client()` dependency in `ai/deps.py`. It queries active model configs from MongoDB asynchronously and caches the client singleton via `@lru_cache` based on the serialized configuration hashes.
- If no providers are configured in the database, the client automatically falls back to `MockLLMClient` to prevent system crashes.
- Configurations are stored in MongoDB via the `LLMProvider` Beanie Document and retrieved using the `LLMProviderRepository` in `ai/db/repository.py`.
- API keys in the database configuration support environment variable placeholders using the shell-style format `"${ENV_VAR_NAME}"` (e.g. `"api_key": "${OPENROUTER_API_KEY}"`), which are dynamically resolved at runtime. Obfuscation logic in routes prevents exposure of actual keys.

## Boundaries
- Do NOT commit `.env` files or real API keys
- Do NOT use synchronous PyMongo — use async Motor
- Do NOT bypass `get_current_user()` — always validate auth
- Do NOT hardcode secrets — use `Settings` from pydantic-settings

## WebSocket chat constraints
- **Single-process only.** The WebSocket chat system (`app/ai/ws/`) uses in-memory state for three things that must be shared across all connections: `MessageDedupStore` (three-state dedup), `GenerationManager` (active LLM generations with token buffers and grace timers), and `ConnectionManager` (per-user connection caps). These are all singletons via `@lru_cache` in `deps.py`. If the backend scales horizontally, each instance would have its own in-memory state, breaking dedup, resume, and connection caps. Before scaling, migrate these to a shared store (Redis).
- **Resume requires sticky sessions.** The `resume=true` query param and `attach_to_generation()` flow depend on the same backend process hosting the `ActiveGeneration`. If a reconnect lands on a different process, it will silently fall back to a normal (non-resumed) generation. The dedup check on the new instance won't find the entry, so a duplicate LLM call will fire. Enforce sticky sessions if deploying multi-instance with the current in-memory architecture.

## Reference docs
- `README.md` — setup guide, API endpoint reference, WebSocket protocol, .env config
- `docs/architecture/` — architecture deep-dives, DI wiring, database design
- `docs/features/` — feature-specific docs (tag system, caching, rate limiting, chat, user model, LLM providers)
