"""
E2E tests for updating journal entries.

Tests the happy path for the PUT /api/v0/journals/{journal_id} endpoint.
"""

import pytest
from httpx import AsyncClient

from app.journals.api.config import JournalRoutes
from app.journals.db.models import Journal
from tests.config import JOURNALS_PREFIX


@pytest.mark.asyncio
async def test_update_journal_full(authenticated_client: AsyncClient, test_user: dict):
    """
    Test updating all fields of a journal entry.
    
    Args:
        authenticated_client: HTTP client with authentication headers
        test_user: Test user fixture with credentials
    """
    # Arrange: Create a journal entry
    original_data = {
        "title": "Original Title",
        "content": "Original content.",
        "tags": ["original"]
    }
    
    create_response = await authenticated_client.post(
        f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}",
        json=original_data
    )
    assert create_response.status_code == 201
    journal_id = create_response.json()["id"]
    
    # Act: Update the journal
    updated_data = {
        "title": "Updated Title",
        "content": "Updated content with more details.",
        "tags": ["updated", "modified"]
    }
    
    response = await authenticated_client.put(
        f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}/{journal_id}",
        json=updated_data
    )
    
    # Assert: Verify response
    assert response.status_code == 200
    response_data = response.json()
    
    assert response_data["id"] == journal_id
    assert response_data["title"] == updated_data["title"]
    assert response_data["content"] == updated_data["content"]
    assert response_data["tags"] == updated_data["tags"]
    
    # Verify changes persisted in database
    db_journal = await Journal.get(journal_id)
    assert db_journal.title == updated_data["title"]
    assert db_journal.content == updated_data["content"]
    assert db_journal.tags == updated_data["tags"]
    assert db_journal.user_id == test_user["user_id"]


@pytest.mark.asyncio
async def test_update_journal_partial(authenticated_client: AsyncClient, test_user: dict):
    """
    Test updating only specific fields of a journal entry.
    
    Args:
        authenticated_client: HTTP client with authentication headers
        test_user: Test user fixture with credentials
    """
    # Arrange: Create a journal entry
    original_data = {
        "title": "Original Title",
        "content": "Original content.",
        "tags": ["original"]
    }
    
    create_response = await authenticated_client.post(
        f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}",
        json=original_data
    )
    assert create_response.status_code == 201
    journal_id = create_response.json()["id"]
    
    # Act: Update only the title
    partial_update = {
        "title": "Only Title Changed"
    }
    
    response = await authenticated_client.put(
        f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}/{journal_id}",
        json=partial_update
    )
    
    # Assert: Verify response
    assert response.status_code == 200
    response_data = response.json()
    
    assert response_data["title"] == partial_update["title"]
    assert response_data["content"] == original_data["content"]  # Should remain unchanged
    assert response_data["tags"] == original_data["tags"]  # Should remain unchanged
    
    # Verify in database
    db_journal = await Journal.get(journal_id)
    assert db_journal.title == partial_update["title"]
    assert db_journal.content == original_data["content"]
    assert db_journal.tags == original_data["tags"]


@pytest.mark.asyncio
async def test_update_journal_not_found(authenticated_client: AsyncClient):
    """
    Test updating a non-existent journal returns 404.
    
    Args:
        authenticated_client: HTTP client with authentication headers
    """
    # Act: Try to update a non-existent journal
    fake_id = "507f1f77bcf86cd799439011"
    update_data = {"title": "New Title"}
    
    response = await authenticated_client.put(
        f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}/{fake_id}",
        json=update_data
    )
    
    # Assert: Verify 404 response
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()
