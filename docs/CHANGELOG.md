# Changelog

All notable changes to the backend will be documented in this file.

## [Unreleased]

### Changed
- **Rate Limiting**: Replaced custom in-memory rate limiter with slowapi + Redis.
  - Redis backend for shared state across blue/green containers (production).
  - Per-route decorators (`@limiter.limit("5/minute")`) replace manual dependency.
  - Rate limit settings now env-configurable (`RATE_LIMIT_DEFAULT`, `REDIS_URL`).

### Added
- **User Model**: Persistent structured memory per user — compact JSON summary of patterns, tone, thinking style, and conversation guidelines
- **User Model Updater**: Background LLM-driven updates triggered every N entries or M words (env-configurable)
- **Context Injection**: XML-structured context (`<user_model>`, `<recent_entries>`, `<chat_history>`) injected into chat system prompts
- **Dev Endpoints**: `POST /memory/update-user-model` and `GET /memory/user-model` (disabled in production)
- **Rate Limiting**: Added rate limiting to authentication endpoints (5 requests per 60 seconds)
- **Request Logging Middleware**: Automatic logging of all requests/responses with request IDs
- **Database Health Check**: `/health` endpoint now actually checks MongoDB connectivity
- **Caching Layer**: Simple in-memory cache for user lookups (5-minute TTL)
- **ObjectId Validation**: Proper validation helper for MongoDB ObjectId conversion
- **Compound Indexes**: Added `user_id + tags` compound index for optimized queries

### Changed
- **Session Per Request**: Refactored to use session-per-request pattern with context variables
- **Dependency Injection**: Implemented FastAPI native DI across all modules
- **Error Handling**: Added custom exception hierarchy with comprehensive logging
- **Transaction Support**: Added ACID transaction support for critical operations
- **Settings Pattern**: Implemented singleton pattern for settings (cached)
- **Auth Routes**: Removed duplicate token verification code in `/me` and `/verify` endpoints

### Fixed
- **Password Reset**: Documented placeholder implementation (removed TODO)
- **Auth Errors**: Fixed dependency injection issues causing 401 errors

### Improved
- **Code Quality**: Eliminated anti-patterns (creating instances in routes)
- **Performance**: Settings loaded once instead of on every request
- **Testability**: Easy to mock dependencies with override system
- **Maintainability**: Clear dependency graph and module boundaries

## [0.1.0] - Initial Release

### Added
- FastAPI backend with MongoDB
- User authentication with JWT
- Journal CRUD operations
- AI-powered mirror reflections
- Structured logging with structlog
- Beanie ODM for MongoDB
