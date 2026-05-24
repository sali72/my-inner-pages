# AI Chat Feature

## Overview

Real-time AI chat over WebSocket. Ephemeral — no messages persisted. The AI receives the user's recent journal entries as context for personalized responses.

## Architecture

```
Client (WebSocket) ──── /api/v0/chat/ws?token=<jwt> ──── FastAPI
                                                              │
                                                    ┌─────────▼─────────┐
                                                    │   ChatService     │
                                                    │  (app/ai/services)│
                                                    └─────────┬─────────┘
                                                              │
                                          ┌───────────────────┼───────────────────┐
                                          │                   │                   │
                              ┌───────────▼──────┐  ┌────────▼───────┐  ┌───────▼────────┐
                              │  MemoryService   │  │  LLMClient     │  │ ConnectionMgr  │
                              │ (journal context)│  │  (streaming)   │  │ (WS registry)  │
                              └──────────────────┘  └────────┬───────┘  └────────────────┘
                                                             │
                                                    ┌────────▼────────┐
                                                    │  Ollama /       │
                                                    │  OpenRouter     │
                                                    └─────────────────┘
```

## Module Structure

```
app/ai/
├── ws/
│   └── manager.py               # ConnectionManager — user→WebSocket registry
├── services/
│   └── chat_service.py           # Chat orchestration (context + streaming)
├── prompts/
│   └── chat.py                   # System prompt template + conversation formatter
└── api/v0/routes/
    └── chat.py                   # WS endpoint with JWT auth
```

### Connection Manager (`app/ai/ws/manager.py`)

In-memory dict mapping `user_id → set[WebSocket]`. Singleton via `@lru_cache` in deps. Supports multiple connections per user (e.g., multiple tabs).

| Method | Description |
|---|---|
| `connect(ws, user_id)` | Accept WS, register |
| `disconnect(ws, user_id)` | Unregister, clean up empty sets |
| `send_json(ws, data)` | Safe send (catches disconnect) |

### Chat Service (`app/ai/services/chat_service.py`)

| Method | Description |
|---|---|
| `build_system_prompt(user_id)` | Fetch recent journals, format system prompt with context |
| `chat_stream(system_prompt, user_message, history)` | Format conversation, stream LLM tokens, yield events |

Uses `MemoryService.build_journal_context()` (same as Mirror) to fetch the user's N most recent journals.

### Prompts (`app/ai/prompts/chat.py`)

- `SYSTEM_PROMPT_TEMPLATE` — Base role prompt
- `USER_PROMPT_WITH_CONTEXT` — Template that injects journal entries
- `build_system_prompt(context)` — Combines base + context
- `format_conversation_prompt(user_message, history)` — Flattens message history into text prompt

## WebSocket Protocol

### Connection

```
ws://host/api/v0/chat/ws?token=<jwt>
```

Server validates JWT, fetches journal context, accepts connection.

### Message Flow

```
Server ──► Client: {"type": "context_loaded"}
Client ──► Server: {"type": "message", "content": "What patterns do you see?"}
Server ──► Client: {"type": "token", "content": "I notice "}
Server ──► Client: {"type": "token", "content": "you've been "}
Server ──► Client: {"type": "token", "content": "writing a lot about..."}
Server ──► Client: {"type": "done"}
```

### Event Types

| Event | Direction | Payload |
|---|---|---|
| `message` | Client→Server | `{"type": "message", "content": "..."}` |
| `context_loaded` | Server→Client | `{"type": "context_loaded"}` |
| `token` | Server→Client | `{"type": "token", "content": "..."}` |
| `done` | Server→Client | `{"type": "done"}` |
| `error` | Server→Client | `{"type": "error", "content": "..."}` |

Errors keep the connection alive — client can retry.

### Session Lifecycle

1. **Connect** — JWT validated, connection registered, journals fetched, `context_loaded` sent
2. **Message loop** — Each user message is processed with in-memory history, LLM response streamed
3. **Disconnect** — Connection unregistered, in-memory history discarded

## Configuration

```env
# LLM provider (any OpenAI-compatible endpoint)
LLM_BASE_URL=http://localhost:11434/v1   # Ollama
LLM_MODEL=llama3.2

# Chat tuning (optional, defaults shown)
CHAT_MAX_TOKENS=1000
CHAT_TEMPERATURE=0.7
MAX_JOURNALS_FOR_CHAT_CONTEXT=10
```

## Key Design Decisions

| Decision | Rationale |
|---|---|
| **Ephemeral** | No DB writes. UI saves context. Simplifies backend and avoids storage concerns. |
| **Context once per connection** | Journals fetched on connect, not per message. Reduces DB load. |
| **In-memory history** | Server tracks conversation for the session. Client sends only new messages. Discarded on disconnect. |
| **Streaming** | LLM tokens pushed as they arrive via `LLMClient.generate_stream()`. Low latency UX. |
| **OpenAI-compatible client** | `ChatOpenAI` from LangChain works with OpenRouter, Ollama, LocalAI, etc. No provider lock-in. |
| **ConnectionManager singleton** | `@lru_cache` on dep function. Zero-copy registry lookup. |
