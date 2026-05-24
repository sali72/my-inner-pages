# AI Module

This module provides AI-powered features for the My Inner Pages journaling app.

## Features

### Mirror — Daily Reflection
Generates personalized insights based on a user's recent journal entries. Supports four modes:

1. **Emotional** — Focus on feelings and emotional patterns
2. **Cognitive** — Examine thoughts and beliefs
3. **Behavioral** — Reflect on actions and habits
4. **Relational** — Understand relationships and connections

### Chat — Real-time AI Conversation
WebSocket-based chat where the user can have a conversation with the AI. The chat is **ephemeral** (no messages saved) but the AI receives the user's recent journal entries as context for personalized responses.

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

#### `/api/v0/chat/ws?token=<jwt>`

Real-time AI chat with journal context. Connection flow:

1. Connect with JWT in query string
2. Server fetches user's recent journals, sends `{"type": "context_loaded"}`
3. Send message: `{"type": "message", "content": "text..."}`
4. Receive tokens: `{"type": "token", "content": "partial..."}`
5. Completion: `{"type": "done"}`
6. Error (connection stays alive): `{"type": "error", "content": "message..."}`

The server maintains conversation history in memory per connection — client only sends new messages. Context is fetched once at connection start.

## Future Enhancements

- Add support for Google and OpenAI providers
- Context summarization for long conversations
- Multiple simultaneous conversations per user
