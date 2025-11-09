"""
E2E tests for creating journal entries.

Tests the happy path and various scenarios for the POST /api/v0/journals endpoint.
"""

import pytest
from httpx import AsyncClient

from app.core.api_config import JournalRoutes


@pytest.mark.asyncio
async def test_create_journal_happy_path(authenticated_client: AsyncClient, test_user: dict):
    """
    Test the happy path for creating a journal entry.
    
    This test verifies that an authenticated user can successfully create
    a journal entry with valid data.
    
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
        JournalRoutes.full(JournalRoutes.ROOT),
        json=journal_data
    )
    
    # Assert: Verify response
    assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.text}"
    
    response_data = response.json()
    
    # Verify response structure
    assert "id" in response_data, "Response should contain journal ID"
    assert "title" in response_data
    assert "content" in response_data
    assert "tags" in response_data
    assert "created_at" in response_data
    assert "updated_at" in response_data
    
    # Verify response data matches input
    assert response_data["title"] == journal_data["title"]
    assert response_data["content"] == journal_data["content"]
    assert response_data["tags"] == journal_data["tags"]
    
    # Verify timestamps are present and valid
    assert response_data["created_at"] is not None
    assert response_data["updated_at"] is not None
    
    # Verify the journal ID is a valid MongoDB ObjectId format (24 hex characters)
    assert len(response_data["id"]) == 24
    assert all(c in "0123456789abcdef" for c in response_data["id"])
