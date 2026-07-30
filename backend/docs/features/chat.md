# AI Chat — SSE Streaming

## Overview

The AI chat uses **Server-Sent Events (SSE)** over HTTP POST for real-time token streaming. This replaced the legacy WebSocket protocol to eliminate in-memory state management (`ConnectionManager`, `GenerationManager`, `MessageDedupStore`) and simplify connection lifecycle.

## Endpoint

```
POST /api/v0/chat/stream
```

### Authentication

Via HttpOnly `access_token` cookie (same as all other API endpoints). No `Authorization` header or URL token required.

### Request Body

```json
{
  "content": "Tell me about my week",
  "chat_id": "optional-chat-uuid",
  "message_id": "client-generated-uuid-for-ack",
  "edit_message_index": 0
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `content` | string | yes | User message text |
| `chat_id` | string \| null | no | Resume existing chat; omitted/null starts a new chat |
| `message_id` | string \| null | no | UUID for ack tracking |
| `edit_message_index` | int \| null | no | Regenerate from this message index (truncates history) |

### Response

`Content-Type: text/event-stream` with `X-Accel-Buffering: no` and `Cache-Control: no-cache`.

## SSE Event Protocol

Each event follows the SSE format: `event: <name>\ndata: <json>\n\n`

### Event Sequence

```
event: context_loaded
data: {"chat_id": "abc-123"}
                                 ← Chat loaded or created
event: ack
data: {"message_id": "uuid-456"}
                                 ← Message received by server (if message_id was sent)
event: token
data: {"content": "Here is "}
                                 ← One or more token events
event: token
data: {"content": "the response"}
                                 ← Final token
event: done
data: {"chat_id": "abc-123", "is_first": true}
                                 ← Generation complete (is_first only on new chats)
```

### Error Event

On rate limit or server error:

```json
event: error
data: {"content": "Error message", "retry_after_seconds": 60}
```

### Event Reference

| Event | Payload | When |
|---|---|---|
| `context_loaded` | `{chat_id}` | Chat loaded or created |
| `ack` | `{message_id}` | After user message is persisted |
| `token` | `{content}` | Each LLM token as it streams |
| `done` | `{chat_id, is_first?}` | Generation complete |
| `error` | `{content, retry_after_seconds?}` | Rate limit or server error |

## Architecture

```
POST /api/v0/chat/stream
        │
  ┌─────┴─────┐
  │  chat.py  │  Validates request, authenticates
  │  (route)  │  Returns StreamingResponse
  └─────┬─────┘
        │
  ┌─────┴──────┐
  │ ChatFacade │  Orchestrates: load/create chat → build prompt → stream LLM → persist
  │ stream_chat│  Yields SSE-formatted strings via async generator
  └─────┬──────┘
        │
  ┌─────┴──────────┐
  │  ChatService   │  Builds system prompt (with journal context, user model),
  │  chat_stream() │  streams tokens from LLM client
  └────────────────┘
```

### Cancellation

When the client disconnects (AbortController, tab close, network drop), FastAPI raises `asyncio.CancelledError` inside the generator. `ChatFacade` catches this, logs it, and re-raises so FastAPI properly cleans up the response stream.

### Rate Limiting

LLM generation is rate-limited per user via `check_rate_limit("llm:{user_id}", llm_rate_limit)` inside `ChatFacade.stream_chat()`. When exceeded, an `error` event with `retry_after_seconds` is yielded instead of starting generation.

## Nginx

```nginx
location /api/v0/chat/stream {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    proxy_buffering off;
    proxy_cache off;
    proxy_read_timeout 300s;
}
```

## Key Differences from Legacy WS

| Aspect | Legacy WebSocket | SSE (current) |
|---|---|---|
| Protocol | `ws://` full-duplex | HTTP POST + SSE stream |
| Auth | `?token=<jwt>` query param | HttpOnly `access_token` cookie |
| Connection state | In-memory ConnectionManager | Stateless per-request |
| Cancel | Send `{"type": "cancel"}` message | Abort HTTP request (AbortController) |
| Resume | 10s grace period + token buffer | Not needed; just send another POST |
| Heartbeat | App-level ping/pong (20s) | N/A — TCP keepalive |
| Message dedup | MessageDedupStore (3-state TTL) | Not needed (idempotent HTTP) |
| Rate limiting | `check_ws_rate_limit()` | `check_rate_limit()` (shared) |
