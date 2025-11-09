# Dependency Injection System

This document explains the dependency injection (DI) system implemented in the backend.

## Architecture Overview

The application uses FastAPI's built-in dependency injection system with a three-tier architecture:

```
Settings (App-scoped, singleton via @lru_cache)
    ↓
Services (Request-scoped, created per request)
    ↓
Facades (Request-scoped, injected into routes)
```

## Directory Structure

```
app/
├── core/
│   └── deps/
│       ├── settings.py      # Singleton settings
│       ├── services.py      # Core services (JWT, Password)
│       ├── auth.py          # Auth dependencies
│       └── database.py      # Database dependencies
├── auth/
│   └── deps.py              # Auth module dependencies
├── journals/
│   └── deps.py              # Journals module dependencies
├── ai/
│   └── deps.py              # AI module dependencies
└── memory/
    └── deps.py              # Memory module dependencies
```

## How It Works

### 1. Settings (Singleton)

Settings are loaded once and cached for the application lifetime:

```python
from functools import lru_cache
from app.core.config import Settings

@lru_cache()
def get_settings() -> Settings:
    """Settings are loaded once and cached"""
    return Settings()
```

### 2. Services (Request-scoped)

Services are created per request with injected dependencies:

```python
from fastapi import Depends
from app.core.deps.settings import get_settings

def get_jwt_service(settings: Settings = Depends(get_settings)) -> JWTService:
    """JWT service with injected settings"""
    return JWTService(settings)
```

### 3. Facades (Request-scoped)

Facades coordinate business logic with all dependencies injected:

```python
def get_journal_facade(
    repository: JournalRepository = Depends(get_journal_repository),
    config: JournalModuleConfig = Depends(get_journal_config)
) -> JournalFacade:
    """Journal facade with all dependencies"""
    return JournalFacade(repository=repository, config=config)
```

### 4. Routes

Routes receive fully configured facades:

```python
@router.post("/journals")
async def create_journal(
    request: CreateJournalRequest,
    current_user: User = Depends(get_current_user),
    facade: JournalFacade = Depends(get_journal_facade)  # Injected!
) -> JournalResponse:
    journal = await facade.create_journal(...)
    return JournalResponse.from_document(journal)
```

## Benefits

### 1. Testability

Easy to mock dependencies in tests:

```python
from unittest.mock import Mock
from fastapi.testclient import TestClient

def test_create_journal():
    # Create mock facade
    mock_facade = Mock(spec=JournalFacade)
    mock_facade.create_journal.return_value = mock_journal
    
    # Override dependency
    app.dependency_overrides[get_journal_facade] = lambda: mock_facade
    
    # Test the route
    client = TestClient(app)
    response = client.post("/api/v0/journals", json={...})
    
    # Cleanup
    app.dependency_overrides.clear()
```

### 2. Performance

- Settings loaded once (not from .env on every request)
- Services reused within a request via FastAPI's dependency cache
- No overhead from complex DI containers

### 3. Type Safety

Full type hints enable IDE autocomplete and type checking:

```python
def get_journal_facade(
    repository: JournalRepository = Depends(get_journal_repository),
    config: JournalModuleConfig = Depends(get_journal_config)
) -> JournalFacade:  # Return type is explicit
    return JournalFacade(repository=repository, config=config)
```

### 4. Flexibility

Easy to swap implementations:

```python
# Development: Use real repository
def get_journal_repository() -> JournalRepository:
    return JournalRepository()

# Testing: Use mock repository
def get_mock_journal_repository() -> JournalRepository:
    return MockJournalRepository()

# Override in tests
app.dependency_overrides[get_journal_repository] = get_mock_journal_repository
```

## Testing Examples

### Unit Testing a Facade

```python
import pytest
from app.journals.facade.journal_facade import JournalFacade
from app.journals.db.repository import JournalRepository
from app.journals.config import JournalModuleConfig
from unittest.mock import Mock, AsyncMock

@pytest.mark.asyncio
async def test_create_journal():
    # Create mock repository
    mock_repo = Mock(spec=JournalRepository)
    mock_repo.create = AsyncMock(return_value=mock_journal)
    
    # Create facade with mock
    config = JournalModuleConfig()
    facade = JournalFacade(repository=mock_repo, config=config)
    
    # Test
    result = await facade.create_journal(
        user_id="123",
        title="Test",
        content="Content"
    )
    
    # Assert
    assert result == mock_journal
    mock_repo.create.assert_called_once()
```

### Integration Testing a Route

```python
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.journals.deps import get_journal_facade
from unittest.mock import Mock

def test_create_journal_endpoint():
    # Create mock facade
    mock_facade = Mock()
    mock_facade.create_journal = AsyncMock(return_value=mock_journal)
    
    # Override dependency
    app.dependency_overrides[get_journal_facade] = lambda: mock_facade
    
    # Test
    client = TestClient(app)
    response = client.post(
        "/api/v0/journals",
        json={"title": "Test", "content": "Content"},
        headers={"Authorization": f"Bearer {valid_token}"}
    )
    
    # Assert
    assert response.status_code == 201
    assert response.json()["title"] == "Test"
    
    # Cleanup
    app.dependency_overrides.clear()
```

## Migration Guide

### Before (Anti-pattern)

```python
@router.post("/journals")
async def create_journal(request: CreateJournalRequest):
    facade = JournalFacade()  # Creates new instance every time
    journal = await facade.create_journal(...)
    return JournalResponse.from_document(journal)
```

### After (Dependency Injection)

```python
@router.post("/journals")
async def create_journal(
    request: CreateJournalRequest,
    facade: JournalFacade = Depends(get_journal_facade)  # Injected
):
    journal = await facade.create_journal(...)
    return JournalResponse.from_document(journal)
```

## Best Practices

1. **Always use Depends()** - Never instantiate facades/services directly in routes
2. **Keep dependencies pure** - Dependency functions should have no side effects
3. **Use type hints** - Enable IDE support and type checking
4. **Cache expensive operations** - Use `@lru_cache()` for singletons
5. **Test with overrides** - Use `app.dependency_overrides` for testing
6. **Clean up after tests** - Always call `app.dependency_overrides.clear()`

## Common Patterns

### Conditional Dependencies

```python
def get_cache_service(settings: Settings = Depends(get_settings)):
    if settings.is_production:
        return RedisCacheService()
    else:
        return InMemoryCacheService()
```

### Nested Dependencies

```python
def get_notification_service(
    email_service: EmailService = Depends(get_email_service),
    sms_service: SMSService = Depends(get_sms_service)
) -> NotificationService:
    return NotificationService(email=email_service, sms=sms_service)
```

### Optional Dependencies

```python
def get_optional_feature(
    settings: Settings = Depends(get_settings)
) -> Optional[FeatureService]:
    if settings.feature_enabled:
        return FeatureService()
    return None
```

## Troubleshooting

### Issue: "Database manager not initialized"

**Cause**: Trying to use database before app startup

**Solution**: Ensure lifespan context manager runs before accessing DB

### Issue: Circular imports

**Cause**: Dependency files importing from each other

**Solution**: Use local imports inside dependency functions:

```python
def get_auth_facade():
    from app.auth.facade.auth_facade import AuthFacade
    return AuthFacade(...)
```

### Issue: Dependencies not being cached

**Cause**: Not using `Depends()` correctly

**Solution**: Always use `Depends()` wrapper:

```python
# Wrong
facade: JournalFacade = get_journal_facade()

# Correct
facade: JournalFacade = Depends(get_journal_facade)
```
