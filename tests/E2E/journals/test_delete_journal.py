"""
E2E tests for deleting journal entries.

Tests the happy path for the DELETE /api/v0/journals/{journal_id} endpoint.
"""

import pytest
from httpx import AsyncClient

from app.journals.api.config import JournalRoutes
from app.journals.db.models import Journal
from tests.config import JOURNALS_PREFIX


@pytest.mark.asyncio
async def test_delete_journal(authenticated_client: AsyncClient, test_user: dict):
    """
    Test deleting a journal entry.
    
    Args:
        authenticated_client: HTTP client with authentication headers
        test_user: Test user fixture with credentials
    """
    # Arrange: Create a journal entry
    journal_data = {
        "title": "Journal to Delete",
        "content": "This journal will be deleted.",
        "tags": ["temporary"]
    }
    
    create_response = await authenticated_client.post(
        f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}",
        json=journal_data
    )
    assert create_response.status_code == 201
    journal_id = create_response.json()["id"]
    
    # Verify journal exists in database before deletion
    db_journal_before = await Journal.get(journal_id)
    assert db_journal_before is not None
    
    # Act: Delete the journal
    response = await authenticated_client.delete(
        f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}/{journal_id}"
    )
    
    # Assert: Verify response
    assert response.status_code == 200
    response_data = response.json()
    assert "deleted successfully" in response_data["message"].lower()
    
    # Verify journal no longer exists in database
    db_journal_after = await Journal.get(journal_id)
    assert db_journal_after is None


@pytest.mark.asyncio
async def test_delete_journal_not_found(authenticated_client: AsyncClient):
    """
    Test deleting a non-existent journal returns 404.
    
    Args:
        authenticated_client: HTTP client with authentication headers
    """
    # Act: Try to delete a non-existent journal
    fake_id = "507f1f77bcf86cd799439011"
    response = await authenticated_client.delete(
        f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}/{fake_id}"
    )
    
    # Assert: Verify 404 response
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_delete_journal_removes_only_target(authenticated_client: AsyncClient, test_user: dict):
    """
    Test that deleting one journal doesn't affect other journals.
    
    Args:
        authenticated_client: HTTP client with authentication headers
        test_user: Test user fixture with credentials
    """
    # Arrange: Create two journal entries
    journal1_data = {"title": "Journal 1", "content": "First journal"}
    journal2_data = {"title": "Journal 2", "content": "Second journal"}
    
    response1 = await authenticated_client.post(
        f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}",
        json=journal1_data
    )
    response2 = await authenticated_client.post(
        f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}",
        json=journal2_data
    )
    
    journal1_id = response1.json()["id"]
    journal2_id = response2.json()["id"]
    
    # Act: Delete only the first journal
    delete_response = await authenticated_client.delete(
        f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}/{journal1_id}"
    )
    
    # Assert: Verify first journal is deleted
    assert delete_response.status_code == 200
    db_journal1 = await Journal.get(journal1_id)
    assert db_journal1 is None
    
    # Verify second journal still exists
    db_journal2 = await Journal.get(journal2_id)
    assert db_journal2 is not None
    assert db_journal2.title == journal2_data["title"]
