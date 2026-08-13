"""
E2E tests for user model creation and management.

Tests the happy path for user model lifecycle: creation via journal
entries, admin inspection, and manual update trigger.
"""

import pytest
from httpx import AsyncClient

from app.journals.api.config import JournalRoutes
from app.memory.db.models import UserModel
from tests.config import JOURNALS_PREFIX, MEMORY_PREFIX


from tests.conftest import make_tiptap_json


@pytest.mark.asyncio
async def test_user_model_created_on_manual_update(
    authenticated_client: AsyncClient, test_user: dict
):
    """
    Test that a user model is created when manually triggered.

    Creates journal entries, then triggers the update via the dev endpoint,
    and verifies the model exists in the database.
    """
    journals = [
        {
            "title": "Getting Started",
            "content_json": make_tiptap_json("Today I started a new journaling habit. I feel hopeful about this journey."),
            "tags": ["habits"],
        },
        {
            "title": "Good Progress",
            "content_json": make_tiptap_json("Been consistent with my routines. Small steps add up over time."),
            "tags": ["progress"],
        },
        {
            "title": "Reflections",
            "content_json": make_tiptap_json("Looking back at the week, I notice I am more patient than I used to be. Growth feels good."),
            "tags": ["reflection", "growth"],
        },
    ]

    for entry in journals:
        resp = await authenticated_client.post(
            f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}", json=entry
        )
        assert resp.status_code == 201

    update_resp = await authenticated_client.post(
        f"{MEMORY_PREFIX}/update-user-model"
    )

    assert update_resp.status_code == 200, f"Expected 200, got {update_resp.status_code}: {update_resp.text}"
    update_data = update_resp.json()
    assert update_data["status"] == "ok"
    assert update_data["version"] == 3
    assert update_data["stats"]["totalEntries"] == 3
    assert update_data["stats"]["totalWords"] > 0

    db_model = await UserModel.find_one({"user_id": test_user["user_id"]})
    assert db_model is not None
    assert db_model.version == 3
    assert db_model.stats.totalEntries == 3
    assert db_model.baseline.emotionalTone != ""
    assert len(db_model.conversationGuidelines) > 0


@pytest.mark.asyncio
async def test_user_model_dev_get_endpoint(
    authenticated_client: AsyncClient, test_user: dict
):
    """
    Test the dev GET endpoint returns the current user model.

    Creates a journal, triggers an update, then reads the model
    via the API and verifies the structure.
    """
    await authenticated_client.post(
        f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}",
        json={"title": "A New Day", "content_json": make_tiptap_json("Feeling optimistic about what lies ahead."), "tags": []},
    )
    await authenticated_client.post(f"{MEMORY_PREFIX}/update-user-model")

    get_resp = await authenticated_client.get(f"{MEMORY_PREFIX}/user-model")

    assert get_resp.status_code == 200
    data = get_resp.json()
    assert data["status"] == "ok"
    assert data["version"] == 3
    assert "updatedAt" in data
    assert data["stats"]["totalEntries"] == 1
    assert data["stats"]["totalWords"] > 0
    assert "emotionalTone" in data["baseline"]
    assert "thinkingStyle" in data["baseline"]
    assert isinstance(data["patterns"], list)
    assert isinstance(data["activeThemes"], list)
    assert isinstance(data["conversationGuidelines"], list)


@pytest.mark.asyncio
async def test_user_model_persists_across_updates(
    authenticated_client: AsyncClient, test_user: dict
):
    """
    Test that user model updates accumulate rather than reset.

    Creates journals in two batches, triggers an update after each,
    and verifies the second update preserves data from the first.
    """
    await authenticated_client.post(
        f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}",
        json={
            "title": "First Batch",
            "content_json": make_tiptap_json("Writing about my morning routine and how it affects my mood throughout the day."),
            "tags": ["routine"],
        },
    )
    await authenticated_client.post(f"{MEMORY_PREFIX}/update-user-model")

    first = await authenticated_client.get(f"{MEMORY_PREFIX}/user-model")
    first_data = first.json()
    first_word_count = first_data["stats"]["totalWords"]

    await authenticated_client.post(
        f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}",
        json={
            "title": "Second Batch",
            "content_json": make_tiptap_json("Trying new approaches to stay productive and mindful. Learning every day."),
            "tags": ["growth"],
        },
    )
    second_update = await authenticated_client.post(f"{MEMORY_PREFIX}/update-user-model")
    assert second_update.status_code == 200
    second_data = second_update.json()

    assert second_data["stats"]["totalEntries"] == 2
    assert second_data["stats"]["totalWords"] > first_word_count
    assert second_data["version"] == 4


@pytest.mark.asyncio
async def test_user_model_isolated_per_user(
    authenticated_client: AsyncClient,
    another_test_user: dict,
    test_user: dict,
    client: AsyncClient,
):
    """
    Test that user models are isolated between different users.
    """
    await authenticated_client.post(
        f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}",
        json={"title": "User 1 Entry", "content_json": make_tiptap_json("This is my personal journal entry."), "tags": []},
    )
    resp1 = await authenticated_client.post(f"{MEMORY_PREFIX}/update-user-model")
    assert resp1.status_code == 200

    other_client = client
    other_client.cookies.set("access_token", another_test_user["access_token"])

    await other_client.post(
        f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}",
        json={"title": "User 2 Entry", "content_json": make_tiptap_json("A completely different journal from another user."), "tags": []},
    )
    resp2 = await other_client.post(f"{MEMORY_PREFIX}/update-user-model")
    assert resp2.status_code == 200

    user1_model = await authenticated_client.get(f"{MEMORY_PREFIX}/user-model")
    user1_data = user1_model.json()
    assert user1_data["stats"]["totalEntries"] == 1

    user2_model = await other_client.get(f"{MEMORY_PREFIX}/user-model")
    user2_data = user2_model.json()
    assert user2_data["stats"]["totalEntries"] == 1

    models = await UserModel.find_all().to_list()
    assert len(models) == 2
    user_ids = {m.user_id for m in models}
    assert test_user["user_id"] in user_ids
    assert another_test_user["user_id"] in user_ids
