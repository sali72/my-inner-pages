# Rate Limiting

## Overview

Rate limiting protects API endpoints from abuse using two independent layers:

- **Nginx**: `limit_req` module — cheap rejection before requests reach the app
- **Backend (slowapi + Redis)**: per-IP and per-user rate limits, shared across blue/green containers

## Backend Implementation

- **Library**: [slowapi](https://github.com/laurentS/slowapi) (wraps the [`limits` library](https://limits.readthedocs.io/))
- **Key function**: `custom_key_func` — priority order:
  1. `request.state.user` — per-user key (`user:{id}`) for authenticated requests
  2. `X-Real-IP` header — authoritative client IP set by nginx/Cloudflare
  3. `X-Forwarded-For` header — fallback for dev without nginx
  4. `request.client.host` — last resort
- **Default limit**: 60 requests per minute (safety net for all routes).
- **Per-route overrides**:
  - 5/minute on auth endpoints (`login`, `register`, `reset-password`)
  - 10/minute on the mirror reflection endpoint (per-user)
- **Storage**:
  - Development/testing: in-memory (no dependencies).
  - Production: Redis (shared across blue/green containers).

## Configuration (`.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `RATE_LIMIT_ENABLED` | `True` | Enable/disable rate limiting entirely |
| `RATE_LIMIT_DEFAULT` | `60/minute` | Default global rate limit string |
| `REDIS_URL` | *(none)* | Redis connection URL for production |

## Usage

### Per-route limit decorator

```python
from app.core.rate_limit import limiter

@router.post("/login")
@limiter.limit("5/minute")
async def login(request: Request, ...):
    ...
```

The route decorator (`@router.*`) must be **above** the limit decorator.
The handler must accept a `request: Request` parameter.

For **authenticated routes**, the limit is automatically per-user —
`custom_key_func` reads `request.state.user` (set by `get_current_user`)
and returns `user:{id}` as the key. No extra plumbing needed.

### WebSocket rate limit

slowapi does not support WebSockets. Use the shared `check_ws_rate_limit` function:

```python
from app.core.rate_limit import check_ws_rate_limit

if not check_ws_rate_limit(f"ws:{user_id}", max_requests=5):
    await websocket.close(code=4003)
```

## Storage Backend Selection

In `app.core.rate_limit.configure_limiter()`:

- If `settings.rate_limit_enabled` is `False`: returns early (no rate limiting)
- If `settings.is_production` is `True` **and** `settings.redis_url` is set:
  uses `RedisStorage`.
- Otherwise: uses `MemoryStorage` (in-process, not shared across workers).

## Rate Limit Response

When a rate limit is exceeded:

- **Status Code**: 429 Too Many Requests
- **Body**: `{"detail": "Rate limit exceeded: 5 per 1 minute"}`
- **Header**: `Retry-After: <seconds>` — approximate time until the window resets
- **Nginx (before app)**: Returns its own 429 without reaching the backend.

## Clearing Rate Limit State (testing)

```python
from app.core.rate_limit import limiter
limiter.reset()
```

This clears all in-memory counters. For Redis, this flushes the rate limit keys.

