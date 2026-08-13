"""
E2E tests for deleting journal entries.

Tests the happy path for the DELETE /api/v0/journals/{journal_id} endpoint.
"""

import pytest
from httpx import AsyncClient

from app.journals.api.config import JournalRoutes
from app.journals.db.models import Journal
from tests.config import JOURNALS_PREFIX
from tests.conftest import make_tiptap_json


@pytest.mark.asyncio
async def test_delete_journal(authenticated_client: AsyncClient, test_user: dict):
    """
    Test deleting a journal entry.
    """
    journal_data = {
        "title": "Journal to Delete",
        "content_json": make_tiptap_json("This journal will be deleted."),
        "tags": ["temporary"]
    }
    
    create_response = await authenticated_client.post(
        f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}",
        json=journal_data
    )
    assert create_response.status_code == 201
    journal_id = create_response.json()["id"]
    
    db_journal_before = await Journal.get(journal_id)
    assert db_journal_before is not None
    
    response = await authenticated_client.delete(
        f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}/{journal_id}"
    )
    
    assert response.status_code == 200
    response_data = response.json()
    assert "deleted successfully" in response_data["message"].lower()
    
    db_journal_after = await Journal.get(journal_id)
    assert db_journal_after is None


@pytest.mark.asyncio
async def test_delete_journal_not_found(authenticated_client: AsyncClient):
    """
    Test deleting a non-existent journal returns 404.
    """
    fake_id = "507f1f77bcf86cd799439011"
    response = await authenticated_client.delete(
        f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}/{fake_id}"
    )
    
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_delete_journal_removes_only_target(authenticated_client: AsyncClient, test_user: dict):
    """
    Test that deleting one journal doesn't affect other journals.
    """
    journal1_data = {"title": "Journal 1", "content_json": make_tiptap_json("First journal")}
    journal2_data = {"title": "Journal 2", "content_json": make_tiptap_json("Second journal")}
    
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
    
    delete_response = await authenticated_client.delete(
        f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}/{journal1_id}"
    )
    
    assert delete_response.status_code == 200
    db_journal1 = await Journal.get(journal1_id)
    assert db_journal1 is None
    
    db_journal2 = await Journal.get(journal2_id)
    assert db_journal2 is not None
    assert db_journal2.title == journal2_data["title"]
