"""
E2E tests for listing journal entries.

Tests the happy path for the GET /api/v0/journals endpoint.
"""

import pytest
from httpx import AsyncClient

from app.journals.api.config import JournalRoutes
from app.journals.db.models import Journal
from tests.config import JOURNALS_PREFIX


@pytest.mark.asyncio
async def test_list_journals_empty(authenticated_client: AsyncClient, test_user: dict):
    """
    Test listing journals when user has no journals.
    
    Args:
        authenticated_client: HTTP client with authentication headers
        test_user: Test user fixture with credentials
    """
    # Act: List journals
    response = await authenticated_client.get(f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}")
    
    # Assert: Verify response
    assert response.status_code == 200
    response_data = response.json()
    
    assert response_data["total"] == 0
    assert response_data["items"] == []
    assert response_data["page"] == 1


@pytest.mark.asyncio
async def test_list_journals_with_data(authenticated_client: AsyncClient, test_user: dict):
    """
    Test listing journals when user has multiple journal entries.
    
    Args:
        authenticated_client: HTTP client with authentication headers
        test_user: Test user fixture with credentials
    """
    # Arrange: Create multiple journals in database
    journals_data = [
        {
            "title": "First Entry",
            "content": "Content of first entry",
            "tags": ["tag1"]
        },
        {
            "title": "Second Entry",
            "content": "Content of second entry",
            "tags": ["tag2"]
        },
        {
            "title": "Third Entry",
            "content": "Content of third entry",
            "tags": ["tag1", "tag2"]
        }
    ]
    
    for journal_data in journals_data:
        await authenticated_client.post(
            f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}",
            json=journal_data
        )
    
    # Act: List journals
    response = await authenticated_client.get(f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}")
    
    # Assert: Verify response
    assert response.status_code == 200
    response_data = response.json()
    
    assert response_data["total"] == 3
    assert len(response_data["items"]) == 3
    assert response_data["page"] == 1
    assert response_data["page_size"] == 20
    
    # Verify all journals have required fields
    for journal in response_data["items"]:
        assert "id" in journal
        assert "title" in journal
        assert "content" in journal


@pytest.mark.asyncio
async def test_list_journals_pagination(authenticated_client: AsyncClient, test_user: dict):
    """
    Test pagination when listing journals.
    
    Args:
        authenticated_client: HTTP client with authentication headers
        test_user: Test user fixture with credentials
    """
    # Arrange: Create 5 journals
    for i in range(5):
        journal_data = {
            "title": f"Entry {i+1}",
            "content": f"Content {i+1}",
        }
        await authenticated_client.post(
            f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}",
            json=journal_data
        )
    
    # Act: List journals with pagination (page_size=2)
    response = await authenticated_client.get(
        f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}?page=1&page_size=2"
    )
    
    # Assert: Verify response
    assert response.status_code == 200
    response_data = response.json()
    
    assert response_data["total"] == 5
    assert len(response_data["items"]) == 2
    assert response_data["page"] == 1
    assert response_data["page_size"] == 2
    
    # Act: Get second page
    response_page2 = await authenticated_client.get(
        f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}?page=2&page_size=2"
    )
    
    # Assert: Verify second page
    assert response_page2.status_code == 200
    response_data_page2 = response_page2.json()
    
    assert response_data_page2["total"] == 5
    assert len(response_data_page2["items"]) == 2
    assert response_data_page2["page"] == 2
