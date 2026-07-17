# AI Chat Feature

## Overview

Real-time AI chat over WebSocket with **persistent storage**. Conversations survive
session boundaries and are browsable via a REST API + sidebar UI. Messages are saved
to MongoDB as they arrive (user immediately, assistant after stream completes). A
sliding-window history (20 turns) is fed into the LLM context.

## Architecture

```
                        ┌─────────────────────────────────────────────┐
                        │              Frontend                       │
                        │  ChatView ── useChatWebSocket hook          │
                        │      │          │                           │
                        │  ChatHistorySidebar (right overlay)         │
                        └──────┼──────────┼───────────────────────────┘
                               │ REST      │ WebSocket
                               │ HTTP/JSON │ streaming
                        ┌──────▼──────────▼───────────────────────────┐
                        │           Backend API                       │
                        │                                             │
                        │  ┌──────────────────────────────────────┐   │
                        │  │        app/ai/api/v0/routes/chat.py  │   │
                        │  │  ┌─────────────┐  ┌──────────────┐  │   │
                        │  │  │  WS /chat/ws │  │ REST /chats  │  │   │
                        │  │  └──────┬──────┘  └──────┬───────┘  │   │
                        │  └─────────┼─────────────────┼──────────┘   │
                        │            │                 │              │
                        │  ┌─────────▼─────────────────▼──────────┐   │
                        │  │        ChatPersistenceService        │   │
                        │  │  (app/chat/service.py)              │   │
                        │  │  - append_message                   │   │
                        │  │  - get_or_create_chat               │   │
                        │  │  - list_chats, delete_chat          │   │
                        │  │  - _generate_title (from 1st msg)   │   │
                        │  └─────────┬───────────────────────────┘   │
                        │            │                               │
                        │  ┌─────────▼───────────┐                   │
                        │  │  ChatHistoryManager  │  sliding window  │
                        │  │  (history_manager)   │  (20 turns max)  │
                        │  └─────────────────────┘                   │
                        │                                             │
                        │  ┌──────────────────────────────────────┐   │
                        │  │  AI ChatService (app/ai/services)    │   │
                        │  │  - build_system_prompt(user_id,      │   │
                        │  │    history=... from DB)              │   │
                        │  │  - chat_stream (LLM streaming)      │   │
                        │  └──────────────┬───────────────────────┘   │
                        │                 │                           │
                        │  ┌──────────────▼───────────────┐           │
                        │  │  LLM Client (OpenRouter/     │           │
                        │  │  Ollama via LangChain)       │           │
                        │  └──────────────────────────────┘           │
                        └─────────────────────────────────────────────┘
```

## Module Structure

### Chat Persistence Module (`app/chat/`)

```
app/chat/
├── config.py                     # ChatModuleConfig (max messages, title length)
├── db/
│   ├── models.py                 # Chat Beanie document
│   └── repository.py             # ChatRepository (CRUD)
├── history_manager.py            # Sliding-window history truncation
├── service.py                    # ChatPersistenceService (business logic)
├── deps.py                       # DI for chat services
└── api/v0/
    ├── schemas/chat.py           # REST response/request models
    └── routes/chat_rest.py       # REST endpoints: list, get, delete chats
```

### AI Chat Module (`app/ai/`)

```
app/ai/
├── ws/
│   ├── manager.py                # ConnectionManager — user→WebSocket registry
│   ├── dedup.py                  # MessageDedupStore — three-state dedup
│   └── generation_manager.py     # GenerationManager — active LLM generations
├── services/chat_service.py      # Chat orchestration (context + streaming)
├── prompts/chat.py               # System prompt template + formatter
├── config.py                     # AIModuleConfig (WS settings, model params)
├── deps.py                       # DI for AI services + WS singletons
└── api/v0/routes/chat.py         # WS endpoint with JWT auth + persistence
```

### ConnectionManager (`app/ai/ws/manager.py`)

In-memory dict mapping `user_id → set[ConnectionInfo]`. Singleton via `@lru_cache` in
deps. Supports multiple connections per user (e.g., multiple tabs) with a per-user cap
of 5 (oldest evicted on cap hit).

Each `ConnectionInfo` tracks `last_activity` (any data flow) and `last_pong` (heartbeat
response only) separately — heartbeat timeout only triggers if both go silent.

| Method | Description |
|---|---|
| `connect(ws, user_id, is_resume)` | Accept WS, register, evict oldest if at cap |
| `disconnect(ws, user_id)` | Unregister, clean up empty sets |
| `send_json(ws, data)` | Safe send, updates `last_activity` on success |
| `send_ping(ws)` | Send `{"type": "ping"}`, does NOT update `last_pong` |
| `record_pong(ws)` | Update both `last_activity` and `last_pong` |
| `get_info(ws)` | Lookup `ConnectionInfo` by ws id |
| `update_activity(ws)` | Touch `last_activity` only |
| `cleanup_zombies(max_idle_seconds)` | Close connections idle >5min |
| `start_zombie_sweep()` | Launch 60s periodic cleanup task |
| `active_count` | Property — total active connections |
| `connections_per_user` | Property — dict of user_id → count |

### MessageDedupStore (`app/ai/ws/dedup.py`)

Three-state in-memory dedup for message IDs. Singleton via `@lru_cache` in deps.

**States:** `pending → processing → completed | aborted`

| Method | Description |
|---|---|
| `check_or_set(message_id, user_id, chat_id)` | Returns `DedupResult(is_duplicate, status)`. Atomically marks `pending` on first call. |
| `mark_processing(message_id)` | Transition `pending → processing` |
| `mark_completed(message_id)` | Transition → `completed`. Future duplicates with same ID are skipped. |
| `mark_aborted(message_id)` | Transition → `aborted`. Duplicates are allowed to reprocess. |

- TTL: 5 minutes on all entries (periodic cleanup via `cleanup_expired`)
- `aborted` state allows retry (unlike `completed` which silently drops)
- Used to protect against: ack-timeout retransmits, user double-click, reconnect resends

### GenerationManager (`app/ai/ws/generation_manager.py`)

Tracks active LLM generations decoupled from their WebSocket connections. Singleton
via `@lru_cache` in deps.

Key concept: when a WebSocket drops, the LLM generation continues into a **token buffer**
for a **grace period** (10s). If the client reconnects with `resume=true` within that
window, the buffered tokens are replayed and streaming continues from where it left off.

| Method | Description |
|---|---|
| `start_generation(...)` | Launch LLM task, register `ActiveGeneration` by `(user_id, chat_id)` |
| `attach_to_generation(user_id, chat_id, ws)` | Reattach a new WS to an active generation, send `generation_resumed` + drain buffer |
| `cancel_generation(user_id, chat_id)` | Cancel the LLM task, mark dedup as `aborted` |
| `on_connection_lost(user_id, chat_id)` | Start grace timer (cancel if already running) |
| `is_active(user_id, chat_id)` | Check if generation is running and not cancelled |
| `active_count` | Property — total active generations |

- Grace timer: 10s configurable via `ws_grace_period` in config
- Buffer grows unbounded during grace (stops when LLM finishes or task is cancelled)
- Zombie old-connection eviction: resume overwrites `gen.ws`, old zombie is detached
- Resume sends `generation_resumed` before buffered tokens so the frontend can show a UI indicator

## REST API

All endpoints require JWT Bearer auth.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v0/chats` | List chats (paginated: `?page=1&page_size=50`) |
| `GET` | `/api/v0/chats/{chat_id}` | Get single chat with full messages |
| `DELETE` | `/api/v0/chats/{chat_id}` | Delete a chat |

### List Response

```json
{
  "items": [
    {
      "id": "abc123",
      "title": "What patterns do you see in my recent writing...",
      "message_count": 12,
      "created_at": "2026-07-04T10:00:00Z",
      "updated_at": "2026-07-04T10:15:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 50,
  "total_pages": 1
}
```

### Single Chat Response

```json
{
  "id": "abc123",
  "title": "What patterns do you see...",
  "messages": [
    {
      "role": "user",
      "content": "What patterns do you see?",
      "created_at": "2026-07-04T10:00:00Z"
    },
    {
      "role": "assistant",
      "content": "I notice you've been writing a lot about...",
      "created_at": "2026-07-04T10:00:05Z"
    }
  ],
  "linked_entry_id": null,
  "created_at": "2026-07-04T10:00:00Z",
  "updated_at": "2026-07-04T10:15:00Z"
}
```

## WebSocket Protocol

### Connection

```
ws://host/api/v0/chat/ws?token=<jwt>[&chat_id=<id>][&resume=true]
```

| Query Param | Required | Description |
|---|---|---|
| `token` | Yes | JWT access token (24h expiry) |
| `chat_id` | No | Resume an existing chat; omit for new chat |
| `resume` | No | `true` when reconnecting mid-generation to reattach |

Server validates JWT, fetches journal context + optional chat history, checks rate limit
(20 connects/minute per user), accepts connection.

On reconnect with `resume=true`, the server tries to reattach to an active generation
(see "Resume Flow" below). If no active generation exists, it sends `generation_lost`
and falls through to normal new-chat flow.

### Close Codes

| Code | Meaning | Client Action |
|---|---|---|
| 1000 | Normal close (server shutdown, idle timeout) | Reconnect with backoff |
| 1001 | Server shutting down | Reconnect with backoff |
| 1006 | Abnormal close (network loss) | Reconnect with backoff |
| 4001 | Authentication failed (bad/expired JWT) | Stop, redirect to login |
| 4003 | Rate limited (too many connects/min) | Reconnect with backoff, check `retry_after_seconds` |

Before closing with 4003, the server sends a JSON error message with
`retry_after_seconds` so the client knows how long to wait.

### Client → Server Messages

| Type | Payload | Description |
|---|---|---|
| `message` | `{"type": "message", "content": "...", "id": "uuid"}` | Send a new user message |
| `edit` | `{"type": "edit", "content": "...", "message_index": N, "id": "uuid"}` | Edit a past message (truncates history from that index) |
| `cancel` | `{"type": "cancel"}` | Stop the current LLM generation (non-destructive — connection stays open) |
| `ping` | `{"type": "ping"}` | Response to server heartbeat (sent by client on receiving server `ping`) |
| `pong` | `{"type": "pong"}` | Response to server heartbeat (sent by client on receiving server `ping`) |

The `id` field on `message`/`edit` is a client-generated UUIDv4 used for:
- **Dedup**: server deduplicates by ID — retransmits safe
- **Ack**: server echoes it back so the client knows the message was received
- **Retry**: same ID on retry → server skips duplicate processing (`aborted` entries allow reprocessing)

### Server → Client Messages

| Type | Payload | Description |
|---|---|---|
| `context_loaded` | `{"type": "context_loaded", "chat_id": string\|null}` | Connection ready, journal context loaded |
| `ack` | `{"type": "ack", "message_id": "..."}` | Confirms receipt of a client message |
| `token` | `{"type": "token", "content": "..."}` | Streaming LLM token |
| `done` | `{"type": "done"}` or `{"type": "done", "chat_id": "...", "aborted": true}` | Stream complete |
| `error` | `{"type": "error", "content": "...", "retry_after_seconds": N}` | Error, connection stays alive |
| `ping` | `{"type": "ping"}` | Heartbeat probe |
| `pong` | `{"type": "pong"}` | Heartbeat response |
| `generation_lost` | `{"type": "generation_lost", "chat_id": "..."}` | Resume failed — no active generation found |
| `generation_resumed` | `{"type": "generation_resumed"}` | Resume succeeded — buffered tokens follow |

- `context_loaded.chat_id` is `null` when connecting without `chat_id` (no chat exists yet)
- `done.chat_id` is included only on the first completed response of a newly-created chat
- `done.aborted` is `true` when the stream was cancelled (client sent `cancel` or grace expired)
- `error.retry_after_seconds` is included for rate limit errors
- `generation_resumed` is sent BEFORE any buffered tokens so the frontend can show a UI indicator
- Errors keep the connection alive — client can retry

### Message Flow — New Chat

```
──► Connect (no chat_id)
◄── {"type": "context_loaded", "chat_id": null}
──► {"type": "message", "content": "What patterns do you see?", "id": "a1b2c3"}
◄── {"type": "ack", "message_id": "a1b2c3"}
    [chat created in DB here]
◄── {"type": "token", "content": "I notice "}
◄── {"type": "token", "content": "you've been "}
◄── {"type": "token", "content": "writing a lot about..."}
◄── {"type": "done", "chat_id": "abc123"}          ◄── chat_id on first done
```

### Message Flow — Existing Chat

```
──► Connect (with chat_id=abc123)
◄── {"type": "context_loaded", "chat_id": "abc123"}
──► {"type": "message", "content": "Tell me more", "id": "d4e5f6"}
◄── {"type": "ack", "message_id": "d4e5f6"}
◄── {"type": "token", "content": "Looking at your "}
◄── {"type": "done"}                                 ◄── no chat_id (already known)
```

### Cancel Flow

```
──► {"type": "cancel"}
    [server cancels LLM task, flushes buffer]
◄── {"type": "done", "aborted": true}
    [connection stays open, user can send a new message]
```

### Resume Flow

```
──► Connect (token=..., chat_id=abc123, resume=true)
    [server finds active generation in grace period]
◄── {"type": "generation_resumed"}
◄── {"type": "token", "content": "buffered tokens so far..."}
◄── {"type": "token", "content": "new streaming tokens..."}
◄── {"type": "done"}

If no active generation:
◄── {"type": "generation_lost", "chat_id": "abc123"}
    [falls through to normal flow]
◄── {"type": "context_loaded", "chat_id": "abc123"}
```

### Heartbeat

Server runs a heartbeat loop per connection:

1. Every **20s** (`ws_ping_interval`): send `{"type": "ping"}`
2. If `last_pong` is older than **25s** (`ws_pong_timeout`): wait 2s, check again
3. If still over 25s: close connection (triggers generation grace period)
4. If `last_pong` is older than **30s** (`ws_connection_close_timeout`): close immediately

Client responds to `ping` by sending `{"type": "pong"}`.

`last_pong` is only updated on `pong` messages — data flow (`token`, `done`, etc.) does
NOT extend the heartbeat timeout. This ensures liveness detection even during long
streaming responses.

### Session Lifecycle

1. **Connect** — JWT validated, rate limit checked, connection registered, journals + optional chat history fetched, `context_loaded` sent
2. **Message loop** — Each user message saved to DB (with ack + dedup), LLM response streamed, assistant message saved on completion
3. **Cancel** — Non-destructive stop: LLM task cancelled, `aborted: true` done event sent, connection stays open
4. **Disconnect** — Generation grace period starts (10s), connection unregistered. If client reconnects with `resume=true` within grace, tokens continue. Otherwise generation is cancelled.
5. **Zombie cleanup** — Periodic sweep (60s) closes connections idle for >5min

## Heartbeat & Rate Limiting

| Setting | Default | Description |
|---|---|---|
| `ws_ping_interval` | 20s | How often server sends `ping` |
| `ws_pong_timeout` | 25s | Max time without `pong` before suspect |
| `ws_connection_close_timeout` | 30s | Max time without `pong` before close |
| `ws_grace_period` | 10s | How long generation continues after WS drop |
| `ws_max_connections_per_user` | 5 | Max simultaneous WS connections per user |
| `ws_dedup_ttl` | 300s (5min) | Message dedup entry TTL |

| Rate Limit | Window | Scope |
|---|---|---|
| WS connections | 20/min | Per user |
| LLM calls (messages) | 10/min | Per user |

When rate limited, the server sends an error JSON with `retry_after_seconds` before
closing or rejecting the request.

## Single-Process Constraint

The WebSocket chat system uses **in-memory state** for three components that must be
shared across all connections:

- `MessageDedupStore` — message dedup entries
- `GenerationManager` — active LLM generations with token buffers and grace timers
- `ConnectionManager` — per-user connection registry

These are all DI singletons via `@lru_cache` in `app/ai/deps.py`. If the backend scales
horizontally, each instance would have its own in-memory state, breaking dedup, resume,
and connection caps.

**Before scaling**, migrate these to a shared Redis store. **Resume also requires sticky
sessions** — a reconnect landing on a different process will not find the active generation
and will silently fall back to a normal (non-resumed) generation.

## Configuration

```env
# LLM provider (any OpenAI-compatible endpoint)
LLM_BASE_URL=http://localhost:11434/v1   # Ollama
LLM_MODEL=llama3.2

# Chat tuning (optional, defaults shown)
CHAT_MAX_TOKENS=1000
CHAT_TEMPERATURE=0.7
MAX_JOURNALS_FOR_CHAT_CONTEXT=10

# Chat persistence (optional, defaults shown)
CHAT_MAX_MESSAGES_FOR_CONTEXT=20        # sliding window size
CHAT_MAX_TITLE_LENGTH=100               # auto-title truncation

# WebSocket tuning (optional, defaults shown)
WS_PING_INTERVAL=20
WS_PONG_TIMEOUT=25
WS_CONNECTION_CLOSE_TIMEOUT=30
WS_GRACE_PERIOD=10
WS_MAX_CONNECTIONS_PER_USER=5
WS_DEDUP_TTL=300
```

## Key Design Decisions

| Decision | Rationale |
|---|---|
| **Persistent via `app/chat/` module** | Separate module from AI logic. Clean separation: `chat/` handles storage, `ai/` handles LLM. Repository pattern with Beanie. |
| **Lazy chat creation** | Chat is created on first user message, not on WS connect. Avoids empty chats when user just opens the page. |
| **`chat_id` in `done` event** | Frontend learns the new chat ID only after the first response completes. No need for a separate creation endpoint. |
| **Messages saved as they arrive** | User message saved immediately, assistant saved after stream completes. No loss on crash. |
| **Sliding-window history** | Only the last N turns sent to LLM context. Configurable via `CHAT_MAX_MESSAGES_FOR_CONTEXT`. Prevents token overflow. |
| **Auto-title from first message** | Title is a truncated (100 chars) copy of the first user message. Simple, no LLM call needed. |
| **REST + WebSocket split** | REST for browsing/deleting past chats. WebSocket for real-time conversation. Clean separation of concerns. |
| **Context once per connection** | Journals fetched on connect, not per message. Reduces DB load. |
| **Streaming** | LLM tokens pushed as they arrive via `LLMClient.generate_stream()`. Low latency UX. |
| **OpenAI-compatible client** | `ChatOpenAI` from LangChain works with OpenRouter, Ollama, LocalAI, etc. No provider lock-in. |
| **ConnectionManager singleton** | `@lru_cache` on dep function. Zero-copy registry lookup. |
| **Ack + dedup** | Every client message includes a UUID. Server acks immediately. Dedup prevents duplicate LLM calls on retransmit. Retry is safe because `aborted` entries allow reprocessing. |
| **Cancel via WS message** | `{"type": "cancel"}` instead of closing the socket. Keeps connection alive, avoids reconnect overhead. |
| **Grace period for generation** | After WS drop, LLM continues for 10s into a buffer. Reconnect with `resume=true` replays buffer and continues. Prevents losing a response in progress. |
| **Heartbeat ping/pong** | App-level liveness detection (not TCP keepalive). `last_pong` tracked separately from `last_activity` so data flow doesn't mask a dead connection. |
| **Per-user connection cap (5)** | Prevents resource exhaustion from runaway tabs. Oldest connection evicted on cap hit (not rejected) so the active tab always works. Resume connections bypass the cap. |
| **Single-process in-memory state** | Dedup, generation manager, and connection manager are in-memory singletons. Simple, zero-downtime deploy via blue/green with sticky sessions. Redis migration needed for horizontal scaling. |
