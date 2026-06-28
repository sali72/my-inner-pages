# E2E Test Suite

This directory contains End-to-End (E2E) tests for the journaling application.

## Structure

```
tests/
├── conftest.py              # Shared pytest fixtures and configuration
├── config.py                # API endpoint prefixes for tests
├── E2E/                     # End-to-End tests
│   ├── auth/                # Authentication module tests
│   │   ├── test_register.py
│   │   ├── test_login.py
│   │   ├── test_get_me.py
│   │   ├── test_verify_token.py
│   │   ├── test_reset_password.py
│   │   └── test_preferences.py
│   ├── journals/            # Journal module tests
│   │   ├── test_create_journal.py
│   │   ├── test_list_journals.py
│   │   ├── test_get_journal.py
│   │   ├── test_update_journal.py
│   │   └── test_delete_journal.py
│   ├── ai/                  # AI/Mirror module tests
│   │   └── test_mirror_reflection.py
│   └── memory/              # Memory module tests
│       └── test_user_model.py
└── README.md                # This file
```

## Running Tests

To run all E2E tests:
```bash
pytest tests/E2E/
```

To run specific test files:
```bash
pytest tests/E2E/journals/test_create_journal.py -v
```

To run a specific test:
```bash
pytest tests/E2E/journals/test_create_journal.py::test_create_journal_happy_path -v
```

## Test Database

The E2E tests use a separate test database (`journaling_app_test`) that is:
- Created automatically before each test
- Cleaned up (dropped) automatically after each test
- Completely isolated from your development/production databases

## Fixtures Available

The `conftest.py` file provides the following fixtures:

### Core Fixtures
- **`test_settings`**: Settings configured for testing environment
- **`test_db_client`**: MongoDB client connected to test database
- **`app`**: FastAPI application instance for testing
- **`client`**: Async HTTP client for making API requests

### Authentication Fixtures
- **`test_user`**: Creates a registered and logged-in test user (default preferences set)
  - Returns: `{"email": str, "password": str, "user_id": str, "access_token": str}`
- **`authenticated_client`**: HTTP client with authentication headers pre-configured
- **`another_test_user`**: Creates a second test user for multi-user scenarios

## Writing New Tests

### Basic Test Structure

```python
import pytest
from httpx import AsyncClient
from app.core.api_config import APIRoutes

@pytest.mark.asyncio
async def test_example(authenticated_client: AsyncClient, test_user: dict):
    """Test description."""
    # Arrange
    data = {"key": "value"}
    
    # Act
    response = await authenticated_client.post(APIRoutes.Journal.CREATE, json=data)
    
    # Assert
    assert response.status_code == 201
    assert response.json()["key"] == "value"
```

**Note**: Always use `APIRoutes` from `app.core.api_config` instead of hardcoding route strings. See [API_CONFIG_USAGE.md](./API_CONFIG_USAGE.md) for details.

### Testing Unauthenticated Endpoints

```python
from app.core.api_config import APIRoutes

@pytest.mark.asyncio
async def test_public_endpoint(client: AsyncClient):
    """Test public endpoint without authentication."""
    response = await client.get(APIRoutes.Health.HEALTH)
    assert response.status_code == 200
```

### Testing Multi-User Scenarios

```python
from app.core.api_config import APIRoutes

@pytest.mark.asyncio
async def test_user_isolation(client: AsyncClient, test_user: dict, another_test_user: dict):
    """Test that users can only access their own data."""
    # User 1 creates a journal
    client.headers.update({"Authorization": f"Bearer {test_user['access_token']}"})
    response = await client.post(
        APIRoutes.Journal.CREATE, 
        json={"title": "Private", "content": "My journal"}
    )
    journal_id = response.json()["id"]
    
    # User 2 tries to access User 1's journal
    client.headers.update({"Authorization": f"Bearer {another_test_user['access_token']}"})
    response = await client.get(APIRoutes.Journal.get(journal_id))
    assert response.status_code == 404  # Should not be found
```

## Current Test Coverage

### Journals Module
- ✅ `test_create_journal_happy_path` - Successfully create a journal entry with valid data

### Coming Soon
- Additional journal CRUD operations (list, get, update, delete)
- Edge cases and error handling
- Authentication module tests
- AI/Mirror module tests

## Notes

- All async fixtures use `@pytest_asyncio.fixture` decorator
- Database is automatically cleaned between tests
- No mocking is used - tests run against a real MongoDB instance
- Tests are isolated and can run in any order
