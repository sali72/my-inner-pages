# AI Services

This directory contains services for AI-powered features in the application.

## Services

### `llm_service.py`
The real LLM service that makes actual API calls to OpenRouter/LLM providers.

**Key Features:**
- Makes HTTP requests to OpenRouter API
- Handles authentication with API keys
- Supports various LLM models
- Error handling and retry logic

**Usage:**
```python
from app.ai.services.llm_service import LLMService

llm_service = LLMService(settings)
response = await llm_service.generate_completion(
    prompt="Reflect on these journal entries...",
    system_prompt="You are a thoughtful reflection assistant",
    model="anthropic/claude-3-sonnet"
)
```

### `mock_llm_service.py`
A mock LLM service for testing and development that returns deterministic responses without API calls.

**Key Features:**
- No API calls or costs
- Deterministic, predictable responses
- Context-aware (detects if user has journals)
- Mode-specific responses (emotional, cognitive, behavioral, relational)
- Same interface as real LLM service

**Usage:**
```python
from app.ai.services.mock_llm_service import MockLLMService

mock_service = MockLLMService(settings)
response = await mock_service.generate_completion(
    prompt="Reflect on these journal entries...",
    system_prompt="You are a thoughtful reflection assistant"
)
```

**When to Use:**
- During testing (automatically enabled in tests)
- During development to avoid API costs
- For demos and presentations
- When API quotas are limited

### `mirror_service.py`
The mirror reflection service that generates personalized reflections based on user's journal entries.

**Key Features:**
- Fetches user's recent journal entries
- Supports multiple reflection modes
- Uses LLM service (real or mock) for generation
- Provides contextual reflections

**Reflection Modes:**
- **Emotional**: Patterns in feelings and emotions
- **Cognitive**: Thought patterns and beliefs
- **Behavioral**: Actions, habits, and responses
- **Relational**: Relationships and connections

## Configuration

### Enabling Mock LLM

**Environment Variable:**
```bash
export USE_MOCK_LLM=true
```

**.env File:**
```
USE_MOCK_LLM=true
```

**Settings:**
```python
from app.core.config import Settings

settings = Settings(use_mock_llm=True)
```

### Automatic Selection

The dependency injection system automatically selects the appropriate service:

```python
# In app/ai/deps.py
def get_llm_service(settings: Settings = Depends(get_settings)):
    if settings.use_mock_llm:
        return MockLLMService(settings)
    return LLMService(settings)
```

## Architecture

```
┌─────────────────┐
│  Mirror Service │
└────────┬────────┘
         │
         ├─────────────────┐
         │                 │
┌────────▼────────┐  ┌────▼────────────┐
│  LLM Service    │  │ Mock LLM Service│
│  (Real API)     │  │  (No API)       │
└─────────────────┘  └─────────────────┘
```

## Testing

All tests automatically use the mock LLM service:

```python
# tests/conftest.py
test_settings_obj = Settings(
    use_mock_llm=True  # Always use mock in tests
)
```

This ensures:
- No API costs during testing
- Fast test execution
- Reliable, deterministic results
- No external dependencies

## Development Workflow

### Development Mode (with Mock)
```bash
# Start server with mock LLM
export USE_MOCK_LLM=true
uvicorn app.main:app --reload
```

### Production Mode (with Real LLM)
```bash
# Ensure USE_MOCK_LLM is not set or is false
export USE_MOCK_LLM=false
export OPENROUTER_API_KEY=your_key_here
uvicorn app.main:app
```

## Best Practices

1. **Use Mock During Development**: Save API costs while building features
2. **Test with Mock**: All automated tests should use mock LLM
3. **Validate with Real LLM**: Periodically test with real LLM to ensure quality
4. **Log Mock Usage**: Keep track of when mock is being used
5. **Update Mock Responses**: Keep mock responses realistic and useful

## Future Enhancements

Potential improvements to the mock service:
- Random variation in responses (while maintaining determinism for tests)
- More sophisticated prompt analysis
- Response caching for frequently used prompts
- Statistics on mock usage
