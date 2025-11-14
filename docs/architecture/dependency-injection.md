# Dependency Injection Pattern

## Overview

FastAPI's built-in dependency injection provides type-safe, testable, and composable dependencies throughout the backend.

## Core Concept

```python
# Define a dependency function
def get_database_session() -> Session:
    session = Session()
    try:
        yield session
    finally:
        session.close()

# Use in route with Depends()
@router.get("/items")
async def get_items(db: Session = Depends(get_database_session)):
    return db.query(Item).all()
```

## Dependency Layers

### Layer 1: Core Dependencies (`app/core/deps/`)

**Database Session** (`database.py`)
```python
async def get_db():
    """Provides MongoDB session per request"""
    # Session stored in context variable
    # Automatically cleaned up after response
```

**Settings** (`settings.py`)
```python
def get_settings() -> Settings:
    """Cached settings singleton"""
    # Loaded once from environment
    # Reused across all requests
```

**Auth** (`auth.py`)
```python
async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    """Validates JWT and returns current user"""
    # Used in all protected routes
```

### Layer 2: Service Dependencies (`app/core/deps/services.py`)

```python
def get_jwt_service(settings: Settings = Depends(get_settings)) -> JWTService:
    """JWT token service"""
    return JWTService(settings.jwt_secret_key)

def get_password_service() -> PasswordService:
    """Password hashing service"""
    return PasswordService()
```

### Layer 3: Module Dependencies

**Repositories** (`app/*/deps.py`)
```python
def get_journal_repository() -> JournalRepository:
    """Journal database repository"""
    return JournalRepository()
```

**Facades** (`app/*/deps.py`)
```python
def get_journal_facade(
    repo: JournalRepository = Depends(get_journal_repository)
) -> JournalFacade:
    """Journal business logic"""
    return JournalFacade(repo)
```

## Usage in Routes

### Basic Pattern
```python
@router.post("/journals", dependencies=[Depends(get_db)])
async def create_journal(
    request: CreateJournalRequest,
    facade: JournalFacade = Depends(get_journal_facade),
    user: User = Depends(get_current_user)
):
    journal = await facade.create_journal(
        user_id=str(user.id),
        title=request.title,
        content=request.content
    )
    return JournalResponse.from_document(journal)
```

### Key Points
- ✅ `dependencies=[Depends(get_db)]` - Ensures DB session is created
- ✅ Dependencies resolved automatically by FastAPI
- ✅ Type hints enable IDE autocomplete
- ✅ Each dependency can have its own dependencies

## Dependency Chain Example

```python
# User requests: GET /journals

Route Handler (get_journals)
    ↓ depends on
JournalFacade (get_journal_facade)
    ↓ depends on
JournalRepository (get_journal_repository)
    ↓ depends on
Database Session (get_db - in route dependencies)
    ↓ depends on
Settings (get_settings)
```

## Benefits

### 1. Testability
```python
# Override dependencies in tests
def get_mock_repository():
    return MockJournalRepository()

app.dependency_overrides[get_journal_repository] = get_mock_repository
```

### 2. Reusability
```python
# Same dependency used in multiple routes
@router.get("/journals")
async def list_journals(
    facade: JournalFacade = Depends(get_journal_facade)
):
    ...

@router.post("/journals")
async def create_journal(
    facade: JournalFacade = Depends(get_journal_facade)
):
    ...
```

### 3. Separation of Concerns
- Routes: HTTP concerns (status codes, validation)
- Facades: Business logic
- Repositories: Data access
- Services: Cross-cutting concerns

### 4. Type Safety
```python
# FastAPI validates types at runtime
facade: JournalFacade = Depends(get_journal_facade)
# ↑ IDE knows this is JournalFacade
# ↑ FastAPI ensures it's actually JournalFacade
```

## Common Patterns

### Singleton Pattern (Settings)
```python
@lru_cache()
def get_settings() -> Settings:
    """Cached - only created once"""
    return Settings()
```

### Factory Pattern (Services)
```python
def get_llm_service(settings: Settings = Depends(get_settings)) -> BaseLLMService:
    """Returns different implementation based on settings"""
    if settings.use_mock_llm:
        return MockLLMService()
    return OpenRouterLLMService(settings.openrouter_api_key)
```

### Resource Management (Database)
```python
async def get_db():
    """Context manager pattern with yield"""
    session = create_session()
    try:
        yield session  # Provide to route
    finally:
        await session.close()  # Always cleanup
```

## Best Practices

### ✅ DO
- Use `Depends()` wrapper in route parameters
- Keep dependencies pure (no side effects in __init__)
- Name dependencies clearly: `get_*_service`, `get_*_repository`
- Document what each dependency provides
- Use type hints for IDE support

### ❌ DON'T
- Call dependency functions directly: `facade = get_facade()` ❌
- Create dependencies inside routes
- Mix business logic into dependency functions
- Use global variables instead of dependencies
- Forget to add `dependencies=[Depends(get_db)]` for DB operations

## Testing with Dependencies

### Unit Test Example
```python
def test_facade_create_journal():
    # Create mock repository
    mock_repo = Mock(spec=JournalRepository)
    mock_repo.create.return_value = fake_journal
    
    # Inject into facade
    facade = JournalFacade(mock_repo)
    
    # Test facade logic
    result = await facade.create_journal(...)
    assert result.title == "Test"
```

### Integration Test Example
```python
@pytest.fixture
def override_dependencies(app):
    # Override specific dependencies for test
    app.dependency_overrides[get_llm_service] = get_mock_llm_service
    yield
    app.dependency_overrides.clear()

async def test_mirror_reflection(client, override_dependencies):
    # LLM service is now mocked
    response = await client.get("/mirror/reflection")
    assert response.status_code == 200
```

## Troubleshooting

### "Session not found" Error
**Problem**: Forgot `dependencies=[Depends(get_db)]` in route
```python
# ❌ Wrong
@router.post("/journals")
async def create_journal(...):

# ✅ Correct
@router.post("/journals", dependencies=[Depends(get_db)])
async def create_journal(...):
```

### Circular Import Error
**Problem**: Modules importing each other
**Solution**: Use forward references or move to `core/deps/`

### Dependency Not Called
**Problem**: Forgot `Depends()` wrapper
```python
# ❌ Wrong - uses return value of function
facade: JournalFacade = get_journal_facade()

# ✅ Correct - FastAPI calls function
facade: JournalFacade = Depends(get_journal_facade)
```
