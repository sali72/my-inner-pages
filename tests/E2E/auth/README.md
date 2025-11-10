# Auth Module E2E Tests

This directory contains end-to-end tests for all authentication routes. These tests verify the happy paths of auth operations without mocking the database.

## Test Files

### `test_register.py`
Tests for user registration:
- **test_register_user_happy_path**: Registers a new user with valid data and verifies the user exists in the database with hashed password
- **test_register_user_email_normalization**: Verifies that email addresses are normalized to lowercase during registration

### `test_login.py`
Tests for user login:
- **test_login_happy_path**: Logs in with valid credentials and verifies JWT token is returned and last_login is updated in database
- **test_login_with_uppercase_email**: Verifies login works with email in different case (case-insensitive)
- **test_login_with_invalid_credentials**: Verifies 401 response when attempting login with incorrect password

### `test_get_me.py`
Tests for getting current user information:
- **test_get_current_user**: Authenticated user retrieves their own information and verifies data matches database
- **test_get_current_user_without_auth**: Verifies 403 response when attempting to get user info without authentication

### `test_verify_token.py`
Tests for JWT token verification:
- **test_verify_token_valid**: Verifies a valid JWT token returns user information matching the database
- **test_verify_token_invalid**: Verifies 403 response when no token is provided
- **test_verify_token_malformed**: Verifies 401 response when a malformed token is provided

### `test_reset_password.py`
Tests for password reset:
- **test_reset_password_existing_user**: Requests password reset for an existing user
- **test_reset_password_non_existing_user**: Verifies the endpoint returns success even for non-existing emails (prevents email enumeration)
- **test_reset_password_email_normalization**: Verifies email normalization works in password reset requests

## Key Features

✅ **No Database Mocking**: All tests interact with a real MongoDB test database
✅ **Database Verification**: Tests verify that data is correctly persisted/modified in the database
✅ **Security Testing**: Tests verify password hashing, email normalization, and proper error responses
✅ **Proper Cleanup**: Each test runs in isolation with database cleanup after execution
✅ **Happy Path Coverage**: Tests focus on successful operations to ensure main functionality works

## Running Tests

Run all auth E2E tests:
```bash
python -m pytest tests/E2E/auth/ -v
```

Run a specific test file:
```bash
python -m pytest tests/E2E/auth/test_register.py -v
```

Run a specific test:
```bash
python -m pytest tests/E2E/auth/test_register.py::test_register_user_happy_path -v
```

## Test Structure

Each test follows the Arrange-Act-Assert pattern:

1. **Arrange**: Set up test data and prerequisites
2. **Act**: Make HTTP request to the API endpoint
3. **Assert**: 
   - Verify HTTP response status and data
   - Verify database state matches expectations

## Fixtures Used

- `client`: HTTP client without authentication (for registration, login)
- `authenticated_client`: HTTP client with authentication headers (for protected routes)
- `test_user`: Test user with credentials and access token
- `test_db_client`: MongoDB client with test database (auto-cleanup)

## Auth Routes Tested

- `POST /api/v0/auth/register` - User registration
- `POST /api/v0/auth/login` - User login
- `GET /api/v0/auth/me` - Get current user information
- `GET /api/v0/auth/verify` - Verify JWT token
- `POST /api/v0/auth/reset-password` - Request password reset

## Notes

- Tests are isolated - each test gets a fresh database
- Passwords are properly hashed in the database (never stored in plain text)
- Email addresses are normalized to lowercase
- Rate limiting is cleared between tests to avoid conflicts
- The test database name is `journaling_app_test` (separate from production/development)
