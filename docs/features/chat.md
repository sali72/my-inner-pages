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
├── ws/manager.py                 # ConnectionManager — user→WebSocket registry
├── services/chat_service.py      # Chat orchestration (context + streaming)
├── prompts/chat.py               # System prompt template + formatter
└── api/v0/routes/chat.py         # WS endpoint with JWT auth + persistence
```

### Connection Manager (`app/ai/ws/manager.py`)

In-memory dict mapping `user_id → set[WebSocket]`. Singleton via `@lru_cache` in
deps. Supports multiple connections per user (e.g., multiple tabs).

| Method | Description |
|---|---|
| `connect(ws, user_id)` | Accept WS, register |
| `disconnect(ws, user_id)` | Unregister, clean up empty sets |
| `send_json(ws, data)` | Safe send (catches disconnect) |

### Chat Persistence Service (`app/chat/service.py`)

| Method | Description |
|---|---|
| `create_chat(user_id, linked_entry_id)` | Create a new empty chat document |
| `get_or_create_chat(user_id, chat_id, linked_entry_id)` | Load existing or create new |
| `append_message(chat_id, user_id, role, content)` | Persist message + auto-title on 1st |
| `get_chat(chat_id, user_id)` | Fetch single chat with messages |
| `get_history_for_context(chat_id, user_id)` | Get sliding-window history for LLM |
| `list_chats(user_id, page, page_size)` | Paginated list with summary |
| `delete_chat(chat_id, user_id)` | Delete chat document |

### AI Chat Service (`app/ai/services/chat_service.py`)

| Method | Description |
|---|---|
| `build_system_prompt(user_id, history=None)` | Fetch recent journals + optional chat history, format prompt |
| `chat_stream(system_prompt, user_message, history)` | Format conversation, stream LLM tokens, yield events |

Uses `MemoryService.build_journal_context()` (same as Mirror) to fetch the user's
N most recent journals. The `history` parameter contains the sliding-window
messages from the current chat.

### Prompts (`app/ai/prompts/chat.py`)

- `SYSTEM_PROMPT_TEMPLATE` — Base role prompt
- `USER_PROMPT_WITH_CONTEXT` — Template that injects journal entries
- `build_system_prompt(context, history)` — Combines base + context + chat history
- `format_conversation_prompt(user_message, history)` — Flattens message history into text

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
ws://host/api/v0/chat/ws?token=<jwt>[&chat_id=<id>]
```

- Without `chat_id`: new session, chat is NOT created yet — waits for first user message
- With `chat_id`: resumes an existing chat, past messages loaded from DB

Server validates JWT, fetches journal context + optional chat history, accepts connection.

### Message Flow

```
──► Connect (no chat_id)
◄── {"type": "context_loaded", "chat_id": null}
──► {"type": "message", "content": "What patterns do you see?"}
    [chat created in DB here]
◄── {"type": "token", "content": "I notice "}
◄── {"type": "token", "content": "you've been "}
◄── {"type": "token", "content": "writing a lot about..."}
◄── {"type": "done", "chat_id": "abc123"}          ◄── chat_id on first done
```

```
──► Connect (with chat_id=abc123)
◄── {"type": "context_loaded", "chat_id": "abc123"}
──► {"type": "message", "content": "Tell me more"}
◄── {"type": "token", "content": "Looking at your "}
◄── {"type": "done"}                                 ◄── no chat_id (already known)
```

### Event Types

| Event | Direction | Payload |
|---|---|---|
| `message` | Client→Server | `{"type": "message", "content": "..."}` |
| `context_loaded` | Server→Client | `{"type": "context_loaded", "chat_id": string\|null}` |
| `token` | Server→Client | `{"type": "token", "content": "..."}` |
| `done` | Server→Client | `{"type": "done"}` or `{"type": "done", "chat_id": "..."}` |
| `error` | Server→Client | `{"type": "error", "content": "..."}` |

- `context_loaded.chat_id` is `null` when connecting without `chat_id` (no chat exists yet)
- `done.chat_id` is included only on the first completed response of a newly-created chat
- Errors keep the connection alive — client can retry

### Session Lifecycle

1. **Connect** — JWT validated, connection registered, journals + optional chat history fetched, `context_loaded` sent
2. **Message loop** — Each user message saved to DB, LLM response streamed, assistant message saved on completion
3. **Disconnect** — Connection unregistered, in-memory state discarded (all data persisted)

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
