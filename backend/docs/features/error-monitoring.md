# Error Monitoring (Sentry)

## Overview

Sentry error monitoring for real-time crash reporting, performance tracing, and production issue diagnosis across both frontend and backend.

## Backend Configuration

### Setup

1. Set `SENTRY_DSN` in the single `.env` at the monorepo root:
   ```env
   SENTRY_DSN=https://your-dsn@your-org.ingest.us.sentry.io/project-id
   ```
2. Sentry is a no-op when the DSN is empty/unset — safe for local dev.

### Initialization

Sentry is initialized in `app/main.py` during startup using `app/core/error_monitoring.py`:

- **DSN**: Optional — if empty, Sentry is disabled
- **Environment**: Derived from `ENVIRONMENT` setting
- **Release**: From `APP_VERSION` (git tag in prod)
- **Traces sample rate**: 0.1 (10% of requests)
- **Profiles sample rate**: 0.1 (10% CPU profiling)

Tags applied to every event:
- `container_id` — Docker container ID (for blue/green deploy debugging)
- `hostname` — Server hostname

### What Gets Captured

| Event | Source | Level |
|---|---|---|
| Unhandled 5xx exceptions | `global_exception_handler` in `main.py` | `error` |
| Request context on 5xx | Same handler — method, URL, client IP, query string | — |
| MongoDB connection retry exhaustion | `lifespan` startup | `error` |
| Slow requests (>5s) | `RequestLoggingMiddleware` | `warning` |
| Rate limit exceeded | slowapi exception handler | — |

### Manual Reporting

Use `capture_exception()` from `app.core.error_monitoring` for handled-but-worthy errors:

```python
from app.core.error_monitoring import capture_exception
capture_exception(exception, context={"key": "value"})
```