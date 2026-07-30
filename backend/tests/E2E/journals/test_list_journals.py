"""
E2E tests for listing journal entries with cursor-based pagination.

Tests the happy path for the GET /api/v0/journals endpoint.
"""

import pytest
from httpx import AsyncClient

from app.journals.api.config import JournalRoutes
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

    assert response_data["items"] == []
    assert response_data["next_cursor"] is None


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

    assert len(response_data["items"]) == 3
    assert response_data["next_cursor"] is None  # All fit on one page

    # Verify all journals have required fields
    for journal in response_data["items"]:
        assert "id" in journal
        assert "title" in journal
        assert "content" in journal

    # Verify newest-first ordering (Third Entry was created last)
    assert response_data["items"][0]["title"] == "Third Entry"
    assert response_data["items"][2]["title"] == "First Entry"


@pytest.mark.asyncio
async def test_list_journals_pagination(authenticated_client: AsyncClient, test_user: dict):
    """
    Test cursor-based pagination when listing journals.

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

    # Act: List journals with page_size=2
    response = await authenticated_client.get(
        f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}?page_size=2"
    )

    # Assert: Verify response
    assert response.status_code == 200
    response_data = response.json()

    assert len(response_data["items"]) == 2
    assert response_data["next_cursor"] is not None

    # Act: Get next page using cursor
    response_page2 = await authenticated_client.get(
        f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}?page_size=2&cursor={response_data['next_cursor']}"
    )

    # Assert: Verify second page
    assert response_page2.status_code == 200
    response_data_page2 = response_page2.json()

    assert len(response_data_page2["items"]) == 2
    # Should still have a cursor since there are 5 total and we've only fetched 4
    assert response_data_page2["next_cursor"] is not None

    # Act: Get third (final) page
    response_page3 = await authenticated_client.get(
        f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}?page_size=2&cursor={response_data_page2['next_cursor']}"
    )

    # Assert: Verify third page has the last entry
    assert response_page3.status_code == 200
    response_data_page3 = response_page3.json()

    assert len(response_data_page3["items"]) == 1
    assert response_data_page3["next_cursor"] is None


@pytest.mark.asyncio
async def test_list_journals_no_duplicates_across_pages(authenticated_client: AsyncClient, test_user: dict):
    """
    Test that cursor pagination does not return duplicate entries across pages.

    Args:
        authenticated_client: HTTP client with authentication headers
        test_user: Test user fixture with credentials
    """
    # Arrange: Create 3 journals
    for i in range(3):
        journal_data = {
            "title": f"Entry {i+1}",
            "content": f"Content {i+1}",
        }
        await authenticated_client.post(
            f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}",
            json=journal_data
        )

    # Act: Fetch all pages with page_size=2
    all_ids = set()
    cursor = None
    while True:
        url = f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}?page_size=2"
        if cursor:
            url += f"&cursor={cursor}"
        response = await authenticated_client.get(url)
        assert response.status_code == 200
        data = response.json()

        for item in data["items"]:
            assert item["id"] not in all_ids, "Duplicate entry across pages"
            all_ids.add(item["id"])

        cursor = data["next_cursor"]
        if cursor is None:
            break

    assert len(all_ids) == 3
