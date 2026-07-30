# Error Monitoring (Sentry)

## Overview

Sentry error monitoring for real-time crash reporting, performance tracing, and production issue diagnosis across both frontend and backend.

## Frontend Configuration

### Setup

1. Set `VITE_SENTRY_DSN` in the single `.env` at the monorepo root:
   ```env
   VITE_SENTRY_DSN=https://your-dsn@your-org.ingest.us.sentry.io/project-id
   ```
2. Sentry is a no-op when the DSN is empty/unset — safe for local dev.

### Initialization

Sentry is initialized in `src/main.tsx` with:

- **Browser Tracing** — Performance traces for page loads and navigation
- **Session Replay** — Captures user interactions for debugging; masked by default (all text/media blocked)
- **Traces sample rate**: 0.1
- **Replays session sample rate**: 0.1
- **Replays on error sample rate**: 1.0 (always record a replay when an error occurs)

### What Gets Captured

| Event | Source | Level |
|---|---|---|
| Unhandled React errors | `Sentry.ErrorBoundary` in `main.tsx` | `error` |
| Network errors (`TypeError: Failed to fetch`) | `api.ts` `request()` | `error` |
| Backend 5xx responses | `api.ts` `request()` | `error` |
| 3+ consecutive failures (any endpoint) | `api.ts` — triggers `backend_unreachable` | `fatal` |
| Slow responses (>5s) | `api.ts` — breadcrumb | `warning` |
| Backend health degraded | `useBackendHealth` hook | `warning` |
| Backend persistently unreachable | `useBackendHealth` hook (5+ failures) | `fatal` |
| SSE stream errors | `useChatStream` | `error` |

### Health Monitor

The `useBackendHealth` hook (invoked from `App.tsx`) polls `/health` every 60 seconds:

- On first failure after healthy → Sentry `warning` event
- On 5 consecutive failures → Sentry `fatal` event
- On recovery → Sentry `info` event
- Exponential backoff up to 5 minutes on repeated failures
- Pauses when tab is hidden; rechecks immediately on tab focus

### Event Tags

All API error events carry:
- `endpoint` — The API path
- `method` — HTTP method
- `status_code` — HTTP status (when available)
- `consecutive_failures` — Running count
- `is_authenticated` — Whether the user had a JWT token
- `error_type` — `network` vs `http`