import pytest
from httpx import AsyncClient

from app.journals.api.config import JournalRoutes
from app.memory.db.models import UserModel, UserModelBaseline, PatternItem, PatternExcerpt
from tests.config import JOURNALS_PREFIX
from tests.conftest import make_tiptap_json


@pytest.mark.asyncio
async def test_get_discoveries_empty_state(
    authenticated_client: AsyncClient, test_user: dict
):
    """
    Test that a user with no entries or model gets a clean 'empty' journey state.
    """
    resp = await authenticated_client.get("/api/v0/discoveries")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["journey"]["status"] == "empty"
    assert data["journey"]["totalEntries"] == 0
    assert data["patterns"] == []
    assert data["moments"] == []


@pytest.mark.asyncio
async def test_get_discoveries_active_state(
    authenticated_client: AsyncClient, test_user: dict
):
    """
    Test Discoveries payload when journals and populated UserModel exist.
    """
    user_id = str(test_user["user_id"])

    # Create journal entry
    journal_payload = {
        "title": "First Step",
        "content_json": make_tiptap_json("I felt peaceful walking in the morning sun."),
        "tags": ["morning", "peace"],
    }
    j_resp = await authenticated_client.post(
        f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}", json=journal_payload
    )
    assert j_resp.status_code == 201
    journal_id = j_resp.json()["id"]

    # Create populated UserModel in database
    model = UserModel(
        user_id=user_id,
        version=2,
        baseline=UserModelBaseline(
            emotionalTone="grounded",
            thinkingStyle="reflective",
            confidence=0.8,
        ),
        patterns=[
            PatternItem(
                description="In your writing, you often explore quiet sensory moments.",
                evidence="Multiple entries mention nature walks.",
                source_excerpts=[
                    PatternExcerpt(
                        entry_id=str(journal_id),
                        quote="I felt peaceful walking in the morning sun.",
                        entry_date="2026-08-30",
                    )
                ],
            )
        ],
        activeThemes=["nature", "mindfulness"],
    )
    from app.memory.db.repository import UserModelRepository
    await UserModelRepository().upsert(model)

    resp = await authenticated_client.get("/api/v0/discoveries")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["journey"]["status"] == "active"
    assert data["journey"]["totalEntries"] >= 1
    assert len(data["patterns"]) == 1
    assert data["patterns"][0]["description"] == "In your writing, you often explore quiet sensory moments."
    assert len(data["patterns"][0]["excerpts"]) == 1
    assert data["patterns"][0]["excerpts"][0]["entryId"] == str(journal_id)
    assert data["activeThemes"] == ["nature", "mindfulness"]
    assert len(data["moments"]) >= 1
    assert data["moments"][0]["type"] == "first_entry"
