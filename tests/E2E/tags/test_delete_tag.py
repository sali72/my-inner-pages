import pytest
from httpx import AsyncClient

from app.journals.db.models import Journal
from app.journals.db.tag_model import Tag
from tests.config import JOURNALS_PREFIX, TAGS_PREFIX


@pytest.mark.asyncio
async def test_delete_tag(authenticated_client: AsyncClient, test_user: dict):
    await authenticated_client.post(
        f"{JOURNALS_PREFIX}",
        json={"title": "Entry", "content": "Content", "tags": ["personal", "growth"]},
    )

    response = await authenticated_client.delete(f"{TAGS_PREFIX}/personal")
    assert response.status_code == 200
    assert "deleted" in response.json()["message"].lower()

    tag = await Tag.find_one({"user_id": test_user["user_id"], "name": "personal"})
    assert tag is None

    journals = await Journal.find({"user_id": test_user["user_id"]}).to_list()
    for j in journals:
        assert "personal" not in j.tags


@pytest.mark.asyncio
async def test_delete_tag_updates_usage_count(authenticated_client: AsyncClient, test_user: dict):
    await authenticated_client.post(
        f"{JOURNALS_PREFIX}",
        json={"title": "Entry", "content": "Content", "tags": ["personal", "growth"]},
    )

    await authenticated_client.delete(f"{TAGS_PREFIX}/personal")

    growth_tag = await Tag.find_one({"user_id": test_user["user_id"], "name": "growth"})
    assert growth_tag is not None
    assert growth_tag.usage_count == 1


@pytest.mark.asyncio
async def test_delete_nonexistent_tag(authenticated_client: AsyncClient, test_user: dict):
    response = await authenticated_client.delete(f"{TAGS_PREFIX}/nonexistent")
    assert response.status_code == 200



