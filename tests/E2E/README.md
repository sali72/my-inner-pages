# End-to-End Tests

This directory contains comprehensive end-to-end tests for all API modules. These tests verify the happy paths of operations without mocking the database, ensuring real-world functionality.

## Overview

**Total Tests**: 35 tests across 3 modules
- **Auth Module**: 13 tests
- **Journals Module**: 13 tests
- **AI Module**: 9 tests

## Directory Structure

```
tests/E2E/
├── auth/                      # Authentication module tests
│   ├── test_register.py       # User registration (2 tests)
│   ├── test_login.py          # User login (3 tests)
│   ├── test_get_me.py         # Get current user (2 tests)
│   ├── test_verify_token.py   # JWT token verification (3 tests)
│   ├── test_reset_password.py # Password reset (3 tests)
│   └── README.md              # Auth tests documentation
│
├── journals/                  # Journals module tests
│   ├── test_create_journal.py # Create journal entries (2 tests)
│   ├── test_list_journals.py  # List journals (3 tests)
│   ├── test_get_journal.py    # Get specific journal (2 tests)
│   ├── test_update_journal.py # Update journal entries (3 tests)
│   ├── test_delete_journal.py # Delete journal entries (3 tests)
│   └── README.md              # Journals tests documentation
│
└── ai/                        # AI module tests
    ├── test_mirror_reflection.py # Mirror reflections (9 tests)
    └── README.md              # AI tests documentation
```

## Key Features

✅ **Real Database Testing**: All tests use a real MongoDB test database (no mocking)
✅ **Database Verification**: Tests verify CRUD operations are correctly persisted in the database
✅ **Mock LLM Service**: AI tests use a mock LLM to avoid API costs while testing full flow
✅ **Isolated Tests**: Each test runs in isolation with automatic database cleanup
✅ **Happy Path Coverage**: Focus on successful operations to ensure core functionality
✅ **Comprehensive Coverage**: All API routes are tested for all modules

## Running Tests

### Run all E2E tests
```bash
python -m pytest tests/E2E/ -v
```

### Run specific module tests
```bash
python -m pytest tests/E2E/auth/ -v
python -m pytest tests/E2E/journals/ -v
```

### Run specific test file
```bash
python -m pytest tests/E2E/auth/test_register.py -v
python -m pytest tests/E2E/journals/test_create_journal.py -v
```

### Run specific test
```bash
python -m pytest tests/E2E/auth/test_register.py::test_register_user_happy_path -v
```

## Test Architecture

### Fixtures (from `tests/conftest.py`)

- **`client`**: HTTP client without authentication
  - Used for public endpoints (register, login, reset password)

- **`authenticated_client`**: HTTP client with valid JWT token
  - Used for protected endpoints requiring authentication
  - Automatically includes Authorization header

- **`test_user`**: Pre-created test user with credentials
  - Provides email, password, user_id, and access_token
  - Used to test authenticated operations

- **`test_db_client`**: MongoDB client connected to test database
  - Automatically initialized with Beanie
  - Cleans up database after each test
  - Clears rate limiter to prevent test interference

### Test Pattern

All tests follow the **Arrange-Act-Assert** pattern:

1. **Arrange**: Set up test data and prerequisites
2. **Act**: Make HTTP request to the API endpoint
3. **Assert**: 
   - Verify HTTP response status code
   - Verify response data structure and content
   - Verify database state matches expectations

### Example Test Structure

```python
@pytest.mark.asyncio
async def test_create_journal_happy_path(authenticated_client: AsyncClient, test_user: dict):
    # Arrange: Prepare test data
    journal_data = {
        "title": "Test Journal",
        "content": "Test content"
    }
    
    # Act: Make API request
    response = await authenticated_client.post("/api/v0/journals", json=journal_data)
    
    # Assert: Verify response
    assert response.status_code == 201
    assert response.json()["title"] == journal_data["title"]
    
    # Assert: Verify database
    db_journal = await Journal.get(response.json()["id"])
    assert db_journal.title == journal_data["title"]
```

## Test Coverage Summary

### Auth Module (13 tests)
- ✅ User registration with validation
- ✅ Email normalization (lowercase)
- ✅ User login with JWT token generation
- ✅ Password verification
- ✅ Last login timestamp tracking
- ✅ Getting current user information
- ✅ JWT token verification
- ✅ Password reset requests
- ✅ Proper error responses (401, 403, 404)

### Journals Module (13 tests)
- ✅ Creating journal entries
- ✅ Listing journals with pagination
- ✅ Retrieving specific journals
- ✅ Updating journal entries (full and partial)
- ✅ Deleting journal entries
- ✅ Database persistence verification
- ✅ User isolation (users can only access their own journals)
- ✅ Proper error responses (404 for not found)

### AI Module (9 tests)
- ✅ Mirror reflection generation
- ✅ Different reflection modes (emotional, cognitive, behavioral, relational)
- ✅ Welcome reflections for new users
- ✅ Context-aware reflections based on journals
- ✅ Mode-specific response validation
- ✅ Invalid mode handling
- ✅ Authentication requirements
- ✅ Mock LLM integration (no API costs)

## Configuration

### Test Database
- **Name**: `journaling_app_test`
- **URL**: From test settings (default: `mongodb://localhost:27017`)
- **Cleanup**: Automatic after each test

### Rate Limiting
- Rate limiter is cleared between tests to prevent interference
- Tests can run sequentially without hitting rate limits

### Mock LLM
- **Name**: Uses mock LLM service instead of real API calls
- **Cost**: Zero API costs during testing
- **Configuration**: Automatically enabled via `use_mock_llm=True` in test settings
- **Behavior**: Provides deterministic, context-aware responses

## Notes

- Tests use real HTTP requests through FastAPI's test client
- Database operations are real (not mocked)
- Each test gets a fresh database state
- Tests verify both API responses and database state
- Password hashing is verified (passwords never stored in plain text)
- Email normalization is tested (case-insensitive)

## Future Enhancements

Potential areas for expansion:
- Edge case testing (validation errors, boundary conditions)
- Unauthorized access testing (accessing other users' resources)
- Performance/load testing
- Integration with CI/CD pipeline
- Test coverage metrics
- Tests for AI/Mirror module routes
