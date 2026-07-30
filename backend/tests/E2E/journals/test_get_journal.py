"""
E2E tests for getting a specific journal entry.

Tests the happy path for the GET /api/v0/journals/{journal_id} endpoint.
"""

import pytest
from httpx import AsyncClient

from app.journals.api.config import JournalRoutes
from app.journals.db.models import Journal
from tests.config import JOURNALS_PREFIX


@pytest.mark.asyncio
async def test_get_journal_by_id(authenticated_client: AsyncClient, test_user: dict):
    """
    Test retrieving a specific journal entry by ID.
    
    Args:
        authenticated_client: HTTP client with authentication headers
        test_user: Test user fixture with credentials
    """
    # Arrange: Create a journal entry
    journal_data = {
        "title": "Test Journal",
        "content": "This is a test journal entry for retrieval.",
        "tags": ["test", "retrieval"]
    }
    
    create_response = await authenticated_client.post(
        f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}",
        json=journal_data
    )
    assert create_response.status_code == 201
    created_journal = create_response.json()
    journal_id = created_journal["id"]
    
    # Act: Retrieve the journal by ID
    response = await authenticated_client.get(
        f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}/{journal_id}"
    )
    
    # Assert: Verify response
    assert response.status_code == 200
    response_data = response.json()
    
    assert response_data["id"] == journal_id
    assert response_data["title"] == journal_data["title"]
    assert response_data["content"] == journal_data["content"]
    assert response_data["tags"] == journal_data["tags"]
    
    # Verify data matches what's in the database
    db_journal = await Journal.get(journal_id)
    assert db_journal is not None
    assert db_journal.title == response_data["title"]
    assert db_journal.content == response_data["content"]
    assert db_journal.user_id == test_user["user_id"]


@pytest.mark.asyncio
async def test_get_journal_not_found(authenticated_client: AsyncClient):
    """
    Test retrieving a non-existent journal returns 404.
    
    Args:
        authenticated_client: HTTP client with authentication headers
    """
    # Act: Try to retrieve a non-existent journal
    fake_id = "507f1f77bcf86cd799439011"  # Valid ObjectId format but doesn't exist
    response = await authenticated_client.get(
        f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}/{fake_id}"
    )
    
    # Assert: Verify 404 response
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()
