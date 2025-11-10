# AI Module E2E Tests

This directory contains end-to-end tests for the AI module routes. These tests use a **mock LLM service** to avoid actual API costs while ensuring the routes work correctly.

## Test Files

### `test_mirror_reflection.py`
Tests for mirror reflection generation:
- **test_get_reflection_without_journals**: Verifies welcome reflection when user has no journals
- **test_get_reflection_with_journals**: Tests reflection generation with existing journal entries
- **test_get_reflection_emotional_mode**: Tests emotional mode (default) reflection
- **test_get_reflection_cognitive_mode**: Tests cognitive mode reflection (thought patterns)
- **test_get_reflection_behavioral_mode**: Tests behavioral mode reflection (actions/habits)
- **test_get_reflection_relational_mode**: Tests relational mode reflection (relationships)
- **test_get_reflection_invalid_mode**: Verifies fallback to default mode for invalid mode
- **test_get_reflection_without_auth**: Verifies 403 response without authentication
- **test_reflection_consistency_across_modes**: Tests all modes return valid reflections

## Mock LLM Service

### Overview

The mock LLM service (`app/ai/services/mock_llm_service.py`) provides deterministic responses without making actual LLM API calls. This is controlled by the `use_mock_llm` configuration setting.

### Configuration

In `app/core/config.py`:
```python
use_mock_llm: bool = False  # Set to True to use mock LLM
```

For tests, this is automatically set to `True` in `tests/conftest.py`:
```python
test_settings_obj = Settings(
    # ... other settings
    use_mock_llm=True  # Always use mock LLM in tests
)
```

### How It Works

1. **Dependency Injection**: The `get_llm_service()` function in `app/ai/deps.py` checks the `use_mock_llm` setting
2. **Mock Service**: When enabled, returns `MockLLMService` instead of real `LLMService`
3. **Deterministic Responses**: Mock service provides consistent, mode-appropriate responses

### Mock Response Strategy

The mock LLM generates context-aware responses:

- **Welcome Messages**: When user has no journals, provides welcoming introductory reflections
- **Mode-Specific Reflections**: When user has journals, provides reflections appropriate to the selected mode:
  - **Emotional**: Focus on feelings and emotional patterns
  - **Cognitive**: Focus on thinking patterns and perspectives
  - **Behavioral**: Focus on actions and habits
  - **Relational**: Focus on relationships and connections

### Using Mock LLM in Development

You can use the mock LLM service during development to avoid API costs:

**Option 1: Environment Variable**
```bash
export USE_MOCK_LLM=true
python -m uvicorn app.main:app --reload
```

**Option 2: .env File**
```
USE_MOCK_LLM=true
```

**Option 3: Code**
```python
# In your settings or config
settings = Settings(use_mock_llm=True)
```

## Key Features

✅ **No LLM API Costs**: All tests use mock responses - no actual OpenRouter/LLM API calls
✅ **Deterministic Results**: Mock responses are consistent and predictable for testing
✅ **Mode Coverage**: Tests all four reflection modes (emotional, cognitive, behavioral, relational)
✅ **Context-Aware Mocks**: Different responses based on whether user has journals or not
✅ **Real Database**: While LLM is mocked, database operations are real
✅ **Easy Development**: Can be enabled in development to avoid API costs

## Running Tests

Run all AI E2E tests:
```bash
python -m pytest tests/E2E/ai/ -v
```

Run a specific test:
```bash
python -m pytest tests/E2E/ai/test_mirror_reflection.py::test_get_reflection_emotional_mode -v
```

Run with verbose mock LLM logging:
```bash
python -m pytest tests/E2E/ai/ -v -s
```

## Test Structure

Each test follows the Arrange-Act-Assert pattern:

1. **Arrange**: Set up test data (create journals if needed)
2. **Act**: Make HTTP request to the mirror reflection endpoint
3. **Assert**: 
   - Verify HTTP response status and structure
   - Verify reflection content is appropriate for the mode
   - Verify available modes are returned

## Fixtures Used

- `authenticated_client`: HTTP client with authentication headers
- `test_user`: Test user with credentials and access token
- `client`: Base HTTP client without authentication (for auth tests)

## Mock LLM Service Details

### Implementation Location
- `app/ai/services/mock_llm_service.py`

### Interface Compatibility
The mock service implements the same interface as the real LLM service:
```python
async def generate_completion(
    self,
    prompt: str,
    system_prompt: Optional[str] = None,
    model: Optional[str] = None,
    max_tokens: int = 500,
    temperature: float = 0.7
) -> str
```

### Mode Detection
The mock service detects the reflection mode from the system prompt to provide appropriate responses:
- Looks for keywords like "cognitive", "behavioral", "relational" in the system prompt
- Defaults to "emotional" mode if not specified

### Response Quality
Mock responses are:
- Contextually appropriate for each mode
- Grammatically correct and natural-sounding
- Similar in length and structure to real LLM responses
- Designed to test the full application flow

## Benefits of Mock LLM

1. **Cost Savings**: No API charges during testing
2. **Speed**: Tests run faster without network calls
3. **Reliability**: No dependency on external API availability
4. **Predictability**: Consistent responses for reliable testing
5. **Development**: Safe experimentation without API costs

## Notes

- Mock LLM is automatically enabled for all tests via `test_settings` fixture
- The mock service logs its activity for debugging
- Real LLM service is used in production unless explicitly configured otherwise
- Mock responses are designed to be realistic enough to test the full flow
