# Journal Routes E2E Tests

This directory contains end-to-end tests for all journal routes. These tests verify the happy paths of CRUD operations without mocking the database.

## Test Files

### `test_create_journal.py`
Tests for creating journal entries:
- **test_create_journal_happy_path**: Creates a journal with full data (title, content, tags) and verifies it exists in the database
- **test_create_journal_with_minimal_data**: Creates a journal with only required fields (title, content) and verifies database persistence

### `test_list_journals.py`
Tests for listing journal entries:
- **test_list_journals_empty**: Verifies correct response when user has no journals
- **test_list_journals_with_data**: Creates multiple journals and verifies they're all returned
- **test_list_journals_pagination**: Tests pagination with multiple pages of results

### `test_get_journal.py`
Tests for retrieving a specific journal:
- **test_get_journal_by_id**: Creates a journal and retrieves it by ID, verifying database consistency
- **test_get_journal_not_found**: Verifies 404 response for non-existent journal IDs

### `test_update_journal.py`
Tests for updating journal entries:
- **test_update_journal_full**: Updates all fields of a journal and verifies changes in database
- **test_update_journal_partial**: Updates only specific fields and verifies other fields remain unchanged
- **test_update_journal_not_found**: Verifies 404 response when updating non-existent journal

### `test_delete_journal.py`
Tests for deleting journal entries:
- **test_delete_journal**: Deletes a journal and verifies it no longer exists in database
- **test_delete_journal_not_found**: Verifies 404 response when deleting non-existent journal
- **test_delete_journal_removes_only_target**: Ensures deleting one journal doesn't affect others

## Key Features

✅ **No Database Mocking**: All tests interact with a real MongoDB test database
✅ **Database Verification**: Tests verify that data is correctly persisted/modified/deleted in the database
✅ **Proper Cleanup**: Each test runs in isolation with database cleanup after execution
✅ **Happy Path Coverage**: Tests focus on successful operations to ensure main functionality works

## Running Tests

Run all journal E2E tests:
```bash
python -m pytest tests/E2E/journals/ -v
```

Run a specific test file:
```bash
python -m pytest tests/E2E/journals/test_create_journal.py -v
```

Run a specific test:
```bash
python -m pytest tests/E2E/journals/test_create_journal.py::test_create_journal_happy_path -v
```

## Test Structure

Each test follows the Arrange-Act-Assert pattern:

1. **Arrange**: Set up test data and prerequisites
2. **Act**: Make HTTP request to the API endpoint
3. **Assert**: 
   - Verify HTTP response status and data
   - Verify database state matches expectations

## Fixtures Used

- `authenticated_client`: HTTP client with authentication headers
- `test_user`: Test user with credentials and access token
- `client`: Base HTTP client without authentication
- `test_db_client`: MongoDB client with test database (auto-cleanup)

## Notes

- Tests are isolated - each test gets a fresh database
- Rate limiting is cleared between tests to avoid conflicts
- The test database name is `journaling_app_test` (separate from production/development)
