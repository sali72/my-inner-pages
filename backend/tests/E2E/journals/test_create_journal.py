"""
E2E tests for creating journal entries.

Tests the happy path and various scenarios for the POST /api/v0/journals endpoint.
"""

import pytest
from httpx import AsyncClient

from app.journals.api.config import JournalRoutes
from app.journals.db.models import Journal
from tests.config import JOURNALS_PREFIX


@pytest.mark.asyncio
async def test_create_journal_happy_path(authenticated_client: AsyncClient, test_user: dict):
    """
    Test the happy path for creating a journal entry.
    
    This test verifies that an authenticated user can successfully create
    a journal entry with valid data and that it's persisted in the database.
    
    Args:
        authenticated_client: HTTP client with authentication headers
        test_user: Test user fixture with credentials
    """
    # Arrange: Prepare journal data
    journal_data = {
        "title": "My First Journal Entry",
        "content": "Today was a wonderful day. I learned a lot about testing and feel great about my progress.",
        "tags": ["personal", "growth", "testing"]
    }
    
    # Act: Create journal entry
    response = await authenticated_client.post(
        f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}",
        json=journal_data
    )
    
    # Assert: Verify response
    assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.text}"
    
    response_data = response.json()
    
    # Verify response data matches input
    assert response_data["title"] == journal_data["title"]
    assert response_data["content"] == journal_data["content"]
    assert response_data["tags"] == journal_data["tags"]
    assert "id" in response_data
    assert "created_at" in response_data
    assert "updated_at" in response_data
    
    # Verify journal exists in database
    journal_id = response_data["id"]
    db_journal = await Journal.get(journal_id)
    
    assert db_journal is not None, "Journal should exist in database"
    assert db_journal.title == journal_data["title"]
    assert db_journal.content == journal_data["content"]
    assert db_journal.tags == journal_data["tags"]
    assert db_journal.user_id == test_user["user_id"]


@pytest.mark.asyncio
async def test_create_journal_with_minimal_data(authenticated_client: AsyncClient, test_user: dict):
    """
    Test creating a journal entry with minimal required data (no tags).
    
    Args:
        authenticated_client: HTTP client with authentication headers
        test_user: Test user fixture with credentials
    """
    # Arrange: Prepare minimal journal data
    journal_data = {
        "title": "Simple Entry",
        "content": "Just a quick note."
    }
    
    # Act: Create journal entry
    response = await authenticated_client.post(
        f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}",
        json=journal_data
    )
    
    # Assert: Verify response
    assert response.status_code == 201
    response_data = response.json()
    
    assert response_data["title"] == journal_data["title"]
    assert response_data["content"] == journal_data["content"]
    assert response_data["tags"] == []
    
    # Verify in database
    db_journal = await Journal.get(response_data["id"])
    assert db_journal is not None
    assert db_journal.title == journal_data["title"]
    assert db_journal.tags == []
