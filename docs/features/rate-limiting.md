# Rate Limiting

## Overview

Rate limiting protects API endpoints from abuse using two independent layers:

- **Nginx**: `limit_req` module — cheap rejection before requests reach the app
- **Backend (slowapi + Redis)**: per-IP and per-user rate limits, shared across blue/green containers

## Backend Implementation

- **Library**: [slowapi](https://github.com/laurentS/slowapi) (wraps the [`limits` library](https://limits.readthedocs.io/))
- **Key function**: Client IP via `X-Forwarded-For` (or direct connection),
  extracted by `get_remote_address`.
- **Default limit**: 60 requests per minute (safety net for all routes).
- **Per-route overrides**: 5/minute on auth endpoints (`login`, `register`,
  `reset-password`).
- **Storage**:
  - Development/testing: in-memory (no dependencies).
  - Production: Redis (shared across blue/green containers).

## Configuration (`.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `RATE_LIMIT_ENABLED` | `True` | Enable/disable rate limiting |
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

### WebSocket rate limit

slowapi does not support WebSockets. Use the shared `check_ws_rate_limit` function:

```python
from app.core.rate_limit import check_ws_rate_limit

if not check_ws_rate_limit(f"ws:{user_id}", max_requests=5):
    await websocket.close(code=4003)
```

### Per-user rate limit (authenticated endpoints)

For authenticated routes, use `limiter.limiter.hit()` directly after the
user is resolved:

```python
from limits import RateLimitItemPerMinute
from app.core.rate_limit import limiter

if not limiter.limiter.hit(RateLimitItemPerMinute(10), f"user:{user_id}"):
    raise HTTPException(status_code=429, ...)
```

## Storage Backend Selection

In `app.core.rate_limit.configure_limiter()`:

- If `settings.is_production` is `True` **and** `settings.redis_url` is set:
  uses `RedisStorage`.
- Otherwise: uses `MemoryStorage` (in-process, not shared across workers).

## Rate Limit Response

When a rate limit is exceeded:

- **Status Code**: 429 Too Many Requests
- **Body**: `{"detail": "Rate limit exceeded: 5 per 1 minute"}`
- **Nginx (before app)**: Returns its own 429 without reaching the backend.

## Clearing Rate Limit State (testing)

```python
from app.core.rate_limit import limiter
limiter.reset()
```

This clears all in-memory counters. For Redis, this flushes the rate limit keys.
