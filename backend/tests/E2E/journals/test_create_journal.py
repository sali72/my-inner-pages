"""
E2E tests for creating journal entries.

Tests the happy path and various scenarios for the POST /api/v0/journals endpoint.
"""

import pytest
from httpx import AsyncClient

from app.journals.api.config import JournalRoutes
from app.journals.db.models import Journal
from tests.config import JOURNALS_PREFIX
from tests.conftest import make_tiptap_json


@pytest.mark.asyncio
async def test_create_journal_happy_path(authenticated_client: AsyncClient, test_user: dict):
    """
    Test the happy path for creating a journal entry.
    """
    raw_text = "Today was a wonderful day. I learned a lot about testing and feel great about my progress."
    journal_data = {
        "title": "My First Journal Entry",
        "content_json": make_tiptap_json(raw_text),
        "tags": ["personal", "growth", "testing"]
    }
    
    response = await authenticated_client.post(
        f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}",
        json=journal_data
    )
    
    assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.text}"
    
    response_data = response.json()
    
    assert response_data["title"] == journal_data["title"]
    assert response_data["content_json"] == journal_data["content_json"]
    assert response_data["content_text"] == raw_text
    assert response_data["tags"] == journal_data["tags"]
    assert "id" in response_data
    assert "created_at" in response_data
    assert "updated_at" in response_data
    
    journal_id = response_data["id"]
    db_journal = await Journal.get(journal_id)
    
    assert db_journal is not None
    assert db_journal.title == journal_data["title"]
    assert db_journal.content_json == journal_data["content_json"]
    assert db_journal.content_text == raw_text
    assert db_journal.tags == journal_data["tags"]
    assert db_journal.user_id == test_user["user_id"]


@pytest.mark.asyncio
async def test_create_journal_with_minimal_data(authenticated_client: AsyncClient, test_user: dict):
    """
    Test creating a journal entry with minimal required data (no tags).
    """
    raw_text = "Just a quick note."
    journal_data = {
        "title": "Simple Entry",
        "content_json": make_tiptap_json(raw_text)
    }
    
    response = await authenticated_client.post(
        f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}",
        json=journal_data
    )
    
    assert response.status_code == 201
    response_data = response.json()
    
    assert response_data["title"] == journal_data["title"]
    assert response_data["content_json"] == journal_data["content_json"]
    assert response_data["content_text"] == raw_text
    assert response_data["tags"] == []
    
    db_journal = await Journal.get(response_data["id"])
    assert db_journal is not None
    assert db_journal.title == journal_data["title"]
    assert db_journal.tags == []


@pytest.mark.asyncio
async def test_create_journal_with_max_length_title(authenticated_client: AsyncClient, test_user: dict):
    """
    Test creating a journal entry with a title of exactly 200 characters.
    """
    title_200 = "T" * 200
    raw_text = "Testing 200 char title."
    journal_data = {
        "title": title_200,
        "content_json": make_tiptap_json(raw_text)
    }

    response = await authenticated_client.post(
        f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}",
        json=journal_data
    )

    assert response.status_code == 201
    assert response.json()["title"] == title_200


@pytest.mark.asyncio
async def test_create_journal_with_excess_title_fails(authenticated_client: AsyncClient):
    """
    Test creating a journal entry with a title exceeding 200 characters returns 422.
    """
    title_201 = "T" * 201
    raw_text = "Testing >200 char title."
    journal_data = {
        "title": title_201,
        "content_json": make_tiptap_json(raw_text)
    }

    response = await authenticated_client.post(
        f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}",
        json=journal_data
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_journal_title_whitespace_and_newline_normalized(authenticated_client: AsyncClient):
    """
    Test that leading/trailing whitespace and newlines are normalized before length check.
    """
    # 200 chars padded with leading/trailing spaces and newlines
    raw_title = "   \n  " + ("A" * 100) + "\n\n" + ("B" * 99) + "   "
    journal_data = {
        "title": raw_title,
        "content_json": make_tiptap_json("Content here.")
    }

    response = await authenticated_client.post(
        f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}",
        json=journal_data
    )

    assert response.status_code == 201
    expected_title = ("A" * 100) + " " + ("B" * 99)
    assert len(expected_title) == 200
    assert response.json()["title"] == expected_title
