"""
E2E tests for updating journal entries.

Tests the happy path for the PUT /api/v0/journals/{journal_id} endpoint.
"""

import pytest
from httpx import AsyncClient

from app.journals.api.config import JournalRoutes
from app.journals.db.models import Journal
from tests.config import JOURNALS_PREFIX
from tests.conftest import make_tiptap_json


@pytest.mark.asyncio
async def test_update_journal_full(authenticated_client: AsyncClient, test_user: dict):
    """
    Test updating all fields of a journal entry.
    """
    orig_text = "Original content."
    original_data = {
        "title": "Original Title",
        "content_json": make_tiptap_json(orig_text),
        "tags": ["original"]
    }
    
    create_response = await authenticated_client.post(
        f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}",
        json=original_data
    )
    assert create_response.status_code == 201
    journal_id = create_response.json()["id"]
    
    updated_text = "Updated content with more details."
    updated_data = {
        "title": "Updated Title",
        "content_json": make_tiptap_json(updated_text),
        "tags": ["updated", "modified"]
    }
    
    response = await authenticated_client.put(
        f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}/{journal_id}",
        json=updated_data
    )
    
    assert response.status_code == 200
    response_data = response.json()
    
    assert response_data["id"] == journal_id
    assert response_data["title"] == updated_data["title"]
    assert response_data["content_json"] == updated_data["content_json"]
    assert response_data["content_text"] == updated_text
    assert response_data["tags"] == updated_data["tags"]
    
    db_journal = await Journal.get(journal_id)
    assert db_journal.title == updated_data["title"]
    assert db_journal.content_json == updated_data["content_json"]
    assert db_journal.content_text == updated_text
    assert db_journal.tags == updated_data["tags"]
    assert db_journal.user_id == test_user["user_id"]


@pytest.mark.asyncio
async def test_update_journal_partial(authenticated_client: AsyncClient, test_user: dict):
    """
    Test updating only specific fields of a journal entry.
    """
    orig_text = "Original content."
    original_data = {
        "title": "Original Title",
        "content_json": make_tiptap_json(orig_text),
        "tags": ["original"]
    }
    
    create_response = await authenticated_client.post(
        f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}",
        json=original_data
    )
    assert create_response.status_code == 201
    journal_id = create_response.json()["id"]
    
    partial_update = {
        "title": "Only Title Changed"
    }
    
    response = await authenticated_client.put(
        f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}/{journal_id}",
        json=partial_update
    )
    
    assert response.status_code == 200
    response_data = response.json()
    
    assert response_data["title"] == partial_update["title"]
    assert response_data["content_json"] == original_data["content_json"]
    assert response_data["content_text"] == orig_text
    assert response_data["tags"] == original_data["tags"]
    
    db_journal = await Journal.get(journal_id)
    assert db_journal.title == partial_update["title"]
    assert db_journal.content_json == original_data["content_json"]
    assert db_journal.content_text == orig_text
    assert db_journal.tags == original_data["tags"]


@pytest.mark.asyncio
async def test_update_journal_not_found(authenticated_client: AsyncClient):
    """
    Test updating a non-existent journal returns 404.
    """
    fake_id = "507f1f77bcf86cd799439011"
    update_data = {"title": "New Title"}
    
    response = await authenticated_client.put(
        f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}/{fake_id}",
        json=update_data
    )
    
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_update_journal_with_max_length_title(authenticated_client: AsyncClient, test_user: dict):
    """
    Test updating a journal entry with a title of exactly 200 characters.
    """
    orig_text = "Original text."
    create_response = await authenticated_client.post(
        f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}",
        json={"title": "Short Title", "content_json": make_tiptap_json(orig_text)}
    )
    assert create_response.status_code == 201
    journal_id = create_response.json()["id"]

    title_200 = "U" * 200
    response = await authenticated_client.put(
        f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}/{journal_id}",
        json={"title": title_200}
    )

    assert response.status_code == 200
    assert response.json()["title"] == title_200


@pytest.mark.asyncio
async def test_update_journal_with_excess_title_fails(authenticated_client: AsyncClient, test_user: dict):
    """
    Test updating a journal entry with title > 200 chars returns 422.
    """
    orig_text = "Original text."
    create_response = await authenticated_client.post(
        f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}",
        json={"title": "Short Title", "content_json": make_tiptap_json(orig_text)}
    )
    assert create_response.status_code == 201
    journal_id = create_response.json()["id"]

    title_201 = "U" * 201
    response = await authenticated_client.put(
        f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}/{journal_id}",
        json={"title": title_201}
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_update_journal_title_normalized(authenticated_client: AsyncClient, test_user: dict):
    """
    Test updating journal title with extra whitespace and newlines normalizes correctly.
    """
    create_response = await authenticated_client.post(
        f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}",
        json={"title": "Short Title", "content_json": make_tiptap_json("Text.")}
    )
    assert create_response.status_code == 201
    journal_id = create_response.json()["id"]

    raw_title = "   \n  " + ("C" * 100) + "\n\n" + ("D" * 99) + "   "
    response = await authenticated_client.put(
        f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}/{journal_id}",
        json={"title": raw_title}
    )

    assert response.status_code == 200
    expected_title = ("C" * 100) + " " + ("D" * 99)
    assert len(expected_title) == 200
    assert response.json()["title"] == expected_title
