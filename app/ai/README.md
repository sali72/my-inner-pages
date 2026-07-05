# AI Module

This module provides AI-powered features for the My Inner Pages journaling app.

## Features

### Mirror — Daily Reflection
Generates personalized insights based on a user's recent journal entries. Supports four modes:

1. **Emotional** — Focus on feelings and emotional patterns
2. **Cognitive** — Examine thoughts and beliefs
3. **Behavioral** — Reflect on actions and habits
4. **Relational** — Understand relationships and connections

### Chat — Real-time AI Conversation with Persistence
WebSocket-based chat where the user can have a conversation with the AI.
Messages are saved to MongoDB as they arrive (user immediately, assistant after
stream completes). Conversations are browsable via a REST API + frontend sidebar.
The AI receives the user's recent journal entries + sliding-window chat history
as context. See `app/chat/` module for persistence layer.

## Structure

```
ai/
├── config.py                    # AI module + chat settings
├── deps.py                      # DI for all AI services
├── integrations/
│   ├── openrouter_client.py     # LLM client (OpenRouter, Ollama via OpenAI-compat)
│   └── mock_llm_client.py       # Mock client for dev/testing
├── prompts/
│   ├── mirror.py                # Mirror prompt templates
│   └── chat.py                  # Chat prompt templates + conversation formatter
├── services/
│   ├── mirror_service.py        # Mirror reflection orchestration
│   └── chat_service.py          # Chat orchestration with streaming + memory
├── ws/
│   └── manager.py               # ConnectionManager (WebSocket registry)
└── api/v0/
    ├── routes/
    │   ├── mirror.py            # GET /mirror/reflection
    │   └── chat.py              # WS /chat/ws
    └── schemas/
        ├── request.py           # WS client message type
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

### WebSocket

#### `/api/v0/chat/ws?token=<jwt>[&chat_id=<id>]`

Real-time AI chat with persistence. Optional `chat_id` to resume an existing chat.

Connection flow:

1. Connect with JWT (with or without `chat_id`)
2. Server sends `{"type": "context_loaded", "chat_id": string|null}`
   (`null` when no `chat_id` provided — chat not created yet)
3. Send message: `{"type": "message", "content": "text..."}`
4. Receive tokens: `{"type": "token", "content": "partial..."}`
5. Completion: `{"type": "done"}` (includes `chat_id` on first response of a new chat)
6. Error (connection stays alive): `{"type": "error", "content": "message..."}`

Messages are persisted to MongoDB via `app/chat/` module. Chat is created lazily
on first user message (not on connect). Sliding-window history (last N turns) is
fed into the LLM context.

## Future Enhancements

- Add support for Google and OpenAI providers
- Context summarization for long conversations
- Multiple simultaneous conversations per user
