# Dependency Injection System

Three-tier DI using FastAPI's built-in `Depends()`:

```
Settings (app-scoped, singleton via @lru_cache)
    ↓
Services / Facades (request-scoped)
    ↓
Routes (receive fully wired dependencies)
```

## Directory Structure

```
app/core/deps/
├── settings.py      # Singleton settings
├── services.py      # Core services (JWT, Password)
├── auth.py          # get_current_user, get_current_active_user
└── database.py      # Session-per-request via contextvars

app/{module}/deps.py  # Module-specific (auth, journals, ai, memory)
```

## How It Works

### Settings — loaded once, cached forever
```python
@lru_cache()
def get_settings() -> Settings:
    return Settings()
```

### Services — receive their own dependencies
```python
def get_jwt_service(settings: Settings = Depends(get_settings)) -> JWTService:
    return JWTService(settings)
```

### Facades — orchestrate business logic
```python
def get_journal_facade(
    repository: JournalRepository = Depends(get_journal_repository),
    config: JournalModuleConfig = Depends(get_journal_config)
) -> JournalFacade:
    return JournalFacade(repository=repository, config=config)
```

### Routes — declare what they need, FastAPI wires it
```python
@router.post("/journals", dependencies=[Depends(get_db)])
async def create_journal(
    request: CreateJournalRequest,
    user: User = Depends(get_current_user),
    facade: JournalFacade = Depends(get_journal_facade)
) -> JournalResponse:
    return await facade.create_journal(...)
```

### Dependency chain resolves automatically
```
Route → Depends(get_journal_facade)
                → Depends(get_journal_repository)
                → Depends(get_journal_config)
Route → Depends(get_current_user)
                → Depends(get_auth_facade)
                → Depends(get_jwt_service)
                            → Depends(get_settings)
                → Depends(get_user_repository)
```

## Testing Patterns

### Unit test — instantiate facade with mocks
```python
mock_repo = Mock(spec=JournalRepository)
mock_repo.create = AsyncMock(return_value=fake_journal)
facade = JournalFacade(repository=mock_repo, config=JournalModuleConfig())
result = await facade.create_journal(...)
```

### Integration test — override DI at the app level
```python
mock_facade = Mock()
mock_facade.create_journal = AsyncMock(return_value=fake_journal)
app.dependency_overrides[get_journal_facade] = lambda: mock_facade
response = await client.post("/api/v0/journals", json={...})
app.dependency_overrides.clear()  # always clean up
```

## Common Patterns

### Factory — conditional implementation
```python
def get_llm_client(settings: Settings = Depends(get_settings)) -> BaseLLMClient:
    if settings.use_mock_llm:
        return MockLLMClient()
    return OpenRouterClient(settings)
```

### Resource management — yield + finally for cleanup
```python
async def get_db():
    session = create_session()
    try:
        yield session
    finally:
        await session.close()
```

## DO / DON'T

- ✅ Use `Depends()` — never instantiate facades/services in routes
- ✅ Keep dependencies pure (no side effects in `__init__`)
- ✅ Type-annotate everything for IDE support
- ✅ Cache singletons with `@lru_cache()`
- ❌ Create dependencies inside route handlers
- ❌ Mix business logic into dependency functions
- ❌ Forget `dependencies=[Depends(get_db)]` on DB routes
- ❌ Forget `app.dependency_overrides.clear()` after tests
- ❌ Call dependency functions directly (`get_facade()` instead of `Depends(get_facade)`)
