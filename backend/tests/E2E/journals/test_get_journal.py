"""
E2E tests for getting a specific journal entry.

Tests the happy path for the GET /api/v0/journals/{journal_id} endpoint.
"""

import pytest
from httpx import AsyncClient

from app.journals.api.config import JournalRoutes
from app.journals.db.models import Journal
from tests.config import JOURNALS_PREFIX
from tests.conftest import make_tiptap_json


@pytest.mark.asyncio
async def test_get_journal_by_id(authenticated_client: AsyncClient, test_user: dict):
    """
    Test retrieving a specific journal entry by ID.
    """
    raw_text = "This is a test journal entry for retrieval."
    journal_data = {
        "title": "Test Journal",
        "content_json": make_tiptap_json(raw_text),
        "tags": ["test", "retrieval"]
    }
    
    create_response = await authenticated_client.post(
        f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}",
        json=journal_data
    )
    assert create_response.status_code == 201
    created_journal = create_response.json()
    journal_id = created_journal["id"]
    
    response = await authenticated_client.get(
        f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}/{journal_id}"
    )
    
    assert response.status_code == 200
    response_data = response.json()
    
    assert response_data["id"] == journal_id
    assert response_data["title"] == journal_data["title"]
    assert response_data["content_json"] == journal_data["content_json"]
    assert response_data["content_text"] == raw_text
    assert response_data["tags"] == journal_data["tags"]
    
    db_journal = await Journal.get(journal_id)
    assert db_journal is not None
    assert db_journal.title == response_data["title"]
    assert db_journal.content_json == response_data["content_json"]
    assert db_journal.user_id == test_user["user_id"]


@pytest.mark.asyncio
async def test_get_journal_not_found(authenticated_client: AsyncClient):
    """
    Test retrieving a non-existent journal returns 404.
    """
    fake_id = "507f1f77bcf86cd799439011"
    response = await authenticated_client.get(
        f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}/{fake_id}"
    )
    
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()
