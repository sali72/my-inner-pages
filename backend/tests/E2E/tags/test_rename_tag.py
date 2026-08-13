import pytest
from httpx import AsyncClient

from app.journals.db.models import Journal
from app.journals.db.tag_model import Tag
from tests.config import JOURNALS_PREFIX, TAGS_PREFIX
from tests.conftest import make_tiptap_json


@pytest.mark.asyncio
async def test_rename_tag(authenticated_client: AsyncClient, test_user: dict):
    await authenticated_client.post(
        f"{JOURNALS_PREFIX}",
        json={"title": "Entry", "content_json": make_tiptap_json("Content"), "tags": ["personal", "growth"]},
    )

    response = await authenticated_client.put(
        f"{TAGS_PREFIX}/personal",
        json={"new_name": "private"},
    )
    assert response.status_code == 200
    assert "renamed" in response.json()["message"].lower()

    journals = await Journal.find({"user_id": test_user["user_id"]}).to_list()
    for j in journals:
        assert "personal" not in j.tags
        assert "private" in j.tags


@pytest.mark.asyncio
async def test_rename_tag_merges_usage(authenticated_client: AsyncClient, test_user: dict):
    await authenticated_client.post(
        f"{JOURNALS_PREFIX}",
        json={"title": "E1", "content_json": make_tiptap_json("C1"), "tags": ["personal"]},
    )
    await authenticated_client.post(
        f"{JOURNALS_PREFIX}",
        json={"title": "E2", "content_json": make_tiptap_json("C2"), "tags": ["private"]},
    )

    response = await authenticated_client.put(
        f"{TAGS_PREFIX}/personal",
        json={"new_name": "private"},
    )
    assert response.status_code == 200

    tag = await Tag.find_one({"user_id": test_user["user_id"], "name": "private"})
    assert tag is not None
    assert tag.usage_count == 2

    old = await Tag.find_one({"user_id": test_user["user_id"], "name": "personal"})
    assert old is None


@pytest.mark.asyncio
async def test_rename_nonexistent_tag(authenticated_client: AsyncClient, test_user: dict):
    response = await authenticated_client.put(
        f"{TAGS_PREFIX}/nonexistent",
        json={"new_name": "whatever"},
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_rename_tag_same_name(authenticated_client: AsyncClient, test_user: dict):
    await authenticated_client.post(
        f"{JOURNALS_PREFIX}",
        json={"title": "Entry", "content_json": make_tiptap_json("Content"), "tags": ["personal"]},
    )

    response = await authenticated_client.put(
        f"{TAGS_PREFIX}/personal",
        json={"new_name": "personal"},
    )
    assert response.status_code == 200
