# AI Module

This module provides AI-powered features for the My Inner Pages journaling app.

## Features

### Mirror Section - Daily Reflection
The mirror section generates personalized insights based on a user's recent journal entries. It uses an LLM (currently OpenRouter) to provide thoughtful reflections.

#### Reflection Modes
The mirror supports four different reflection modes to avoid repetition:

1. **Emotional** 💗 - Focus on feelings and emotional patterns
2. **Cognitive** 🧠 - Examine thoughts and beliefs
3. **Behavioral** ⚡ - Reflect on actions and habits
4. **Relational** 🤝 - Understand relationships and connections

## Structure

```
ai/
├── config.py                    # AI module configuration
├── services/
│   ├── llm_service.py          # LLM provider integration (OpenRouter)
│   └── mirror_service.py       # Mirror reflection generation logic
└── api/
    └── v0/
        ├── schemas/
        │   └── response.py     # API response models
        └── routes/
            └── mirror.py       # Mirror API endpoints
```

## Configuration

Add to your `.env` file:

```
OPENROUTER_API_KEY=your_api_key_here
```

## API Endpoints

### GET `/api/v0/mirror/reflection`
Generate a personalized daily reflection.

**Query Parameters:**
- `mode` (optional): One of `emotional`, `cognitive`, `behavioral`, `relational`. Defaults to `emotional`.

**Response:**
```json
{
  "reflection": "Your recent entries show...",
  "mode": "emotional",
  "available_modes": ["emotional", "cognitive", "behavioral", "relational"],
  "error": null
}
```

## Response Cleaning

The LLM service automatically cleans up model-specific tokens that sometimes appear in responses:
- `<|begin_of_sentence|>`, `<｜begin▁of▁sentence｜>`
- `<|end_of_sentence|>`, `<|im_start|>`, `<|im_end|>`
- Other common model artifacts

This ensures users only see clean, natural reflections.

## Future Enhancements

- Add support for Google and OpenAI providers
- Integrate with LangChain for more sophisticated processing
- Add caching for daily reflections
- Support custom reflection prompts
