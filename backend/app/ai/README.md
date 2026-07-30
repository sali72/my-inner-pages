# AI Module

This module provides AI-powered features for the My Inner Pages journaling app.

## Features

### Mirror — Daily Reflection
Generates personalized insights based on a user's recent journal entries. Supports four modes:

1. **Emotional** — Focus on feelings and emotional patterns
2. **Cognitive** — Examine thoughts and beliefs
3. **Behavioral** — Reflect on actions and habits
4. **Relational** — Understand relationships and connections

### Chat — Real-time AI Conversation with Persistence (SSE Streaming)
HTTP POST + Server-Sent Events (SSE) based chat where the user can have a conversation with the AI.
Messages are saved to MongoDB as they arrive (user immediately, assistant after
stream completes). Conversations are browsable via a REST API + frontend sidebar.
The AI receives the user's recent journal entries + sliding-window chat history
as context. See `app/chat/` module for persistence layer.

## Structure

```
ai/
├── config.py                    # AI module + chat settings
├── deps.py                      # DI for all AI services
├── facade/
│   └── chat_facade.py           # SSE stream orchestration
├── integrations/
│   ├── litellm_client.py        # LLM client (LiteLLM / OpenAI-compat)
│   └── mock_llm_client.py       # Mock client for dev/testing
├── prompts/
│   ├── mirror.py                # Mirror prompt templates
│   └── chat.py                  # Chat prompt templates + conversation formatter
├── services/
│   ├── mirror_service.py        # Mirror reflection orchestration
│   └── chat_service.py          # Chat orchestration with streaming + memory
└── api/
    ├── routes/
    │   ├── mirror.py            # GET /mirror/reflection
    │   └── chat.py              # POST /chat/stream
    └── schemas/
        ├── request.py           # Stream request model
        └── response.py          # REST response models
```

## Configuration

```env
# LLM provider — any OpenAI-compatible endpoint
LLM_BASE_URL=http://localhost:11434/v1   # Ollama
# LLM_BASE_URL=https://openrouter.ai/api/v1  # OpenRouter

USE_MOCK_LLM=false   # set true to bypass any real API

# Chat tuning (optional)
CHAT_MAX_TOKENS=1000
CHAT_TEMPERATURE=0.7
```

## API Endpoints

### REST

#### GET `/api/v0/mirror/reflection`

**Query Parameters:**
- `mode` (optional): `emotional`, `cognitive`, `behavioral`, `relational`. Defaults to `emotional`.

**Response:**
```json
{
  "reflection": "Your recent entries show...",
  "mode": "emotional",
  "available_modes": ["emotional", "cognitive", "behavioral", "relational"],
  "error": null
}
```

### SSE Stream

#### POST `/api/v0/chat/stream`

Real-time AI chat streaming via Server-Sent Events (`text/event-stream`).

**Request Body:**
```json
{
  "content": "Hello, AI!",
  "chat_id": "optional_chat_id",
  "message_id": "optional_client_message_id",
  "edit_message_index": null
}
```

**SSE Events Streamed:**

1. `event: context_loaded` $\rightarrow$ `data: {"chat_id": "string"}`
2. `event: ack` $\rightarrow$ `data: {"message_id": "string"}`
3. `event: token` $\rightarrow$ `data: {"content": "partial_text"}`
4. `event: done` $\rightarrow$ `data: {"chat_id": "string"}`
5. `event: error` $\rightarrow$ `data: {"content": "error_message", "retry_after_seconds": 10}`

Messages are persisted to MongoDB via `app/chat/` module. Chat is created lazily
on first user message if no `chat_id` is provided.
