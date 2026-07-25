# ADR 002: Migrate AI Chat from WebSocket to SSE Streaming

**Date:** 2026-07-25

**Status:** Accepted

## Context

The AI chat feature originally used a full-duplex WebSocket connection (`/api/v0/chat/ws`) with a custom in-memory state layer:

- `ConnectionManager` — per-user connection registry with caps and zombie cleanup
- `GenerationManager` — active LLM generations with 10s grace period for reconnect
- `MessageDedupStore` — three-state message dedup to prevent duplicate LLM calls
- App-level ping/pong heartbeat for liveness detection

This added ~500 lines of boilerplate and imposed several constraints:

- **Single-process only** — all three managers were in-memory singletons, preventing horizontal scaling without Redis migration
- **Sticky sessions required** — reconnect with `resume=true` had to land on the same process
- **Token-in-URL auth** — JWT passed as `?token=` query param (logged by nginx, leak-prone)
- **Reconnect complexity** — jittered exponential backoff, message queue with ack timers, grace period tracking
- **Nginx overhead** — required `Upgrade`/`Connection` headers and `proxy_read_timeout` tuning

## Decision

Replace the WebSocket protocol with **HTTP POST + Server-Sent Events (SSE)** for token streaming.

### Chosen approach

- `POST /api/v0/chat/stream` accepts a JSON body and returns `text/event-stream`
- Auth via standard HttpOnly `access_token` cookie (same as all other endpoints)
- Frontend uses `fetch()` + `ReadableStream` with `AbortController` for cancellation
- Server sends named SSE events: `context_loaded`, `ack`, `token`, `done`, `error`
- FastAPI `StreamingResponse` + async generator handles backpressure and cancellation
- Client disconnect raises `asyncio.CancelledError` — no custom cleanup needed

### Rationale

1. **Stateless by design** — each request is independent; no ConnectionManager, no sticky sessions
2. **Standard HTTP auth** — HttpOnly cookies, no token-in-URL, no custom header parsing
3. **Simpler frontend** — `fetch()` + reader replaces WebSocket constructor, reconnect logic, message queue, ack timers
4. **Cancellation via AbortController** — no need to send a `cancel` message over the wire
5. **Nginx-friendly** — just `proxy_buffering off`; no `Upgrade` headers, no 101 Switching Protocols
6. **Horizontally scalable** — any backend instance can handle any chat request without shared state
7. **Industry alignment** — ChatGPT, Claude, and most modern AI chat APIs use SSE over HTTP

### Alternatives considered

| Alternative | Reason rejected |
|---|---|
| Keep WebSocket | Continued maintaining ~500 lines of in-memory state, sticky sessions, reconnect complexity |
| `EventSource` API | Read-only (no POST body), can't set custom headers for auth, no arbitrary cancellation |
| gRPC server-streaming | Added infrastructure dependency, overkill for token streaming, no browser native support |
| Long polling | Higher latency, more server load, no native streaming |
| WebTransport | Too new, limited browser support, no nginx support |

## Consequences

### Positive

- **~500 lines removed** from backend (`ws/` module deleted), ~250 from frontend (connection manager hook, reconnect logic)
- **No sticky sessions** needed — blue/green deploy works without session affinity
- **No Redis dependency** for chat state (only needed for rate limiting)
- **Faster deploys** — no concern about in-flight generations during blue/green swap
- **Standard observability** — nginx access logs capture chat requests like any other HTTP endpoint
- **Simpler Sentry debugging** — each chat request is a standard HTTP span, not a long-lived WS connection

### Negative

- **Server→client only** — SSE is unidirectional; if we ever need server-initiated messages outside of a POST response, we'd need a separate mechanism
- **Cookie auth required** — the backend reads `access_token` from cookies; if we ever need token-based auth for mobile clients, we'd need to add `Authorization` header support
- **One stream per request** — no multiplexing; each chat message creates a new HTTP connection (negligible for the use case)

### Migration notes

- The old `/api/v0/chat/ws` endpoint was removed — no backward compatibility
- The `VITE_WS_URL` environment variable was removed from CI, Dockerfile, and configs
- Nginx `proxy_buffering off` was added for the SSE route only
- Backend tests required no changes (they test the facade/service layer, not the transport)
- All existing frontend features (streaming tokens, stop generation, edit messages, regenerate, new chat) work identically

## References

- [SSE spec (W3C)](https://html.spec.whatwg.org/multipage/server-sent-events.html)
- [FastAPI StreamingResponse docs](https://fastapi.tiangolo.com/advanced/custom-response/#streamingresponse)
- [nginx SSE proxying guide](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_buffering)
- [ADR 001: Local-first editor architecture](../frontend/docs/adr/001-local-first-editor-architecture.md)
