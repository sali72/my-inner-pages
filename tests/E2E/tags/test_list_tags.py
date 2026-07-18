import pytest
from httpx import AsyncClient

from tests.config import JOURNALS_PREFIX, TAGS_PREFIX


@pytest.mark.asyncio
async def test_list_tags_empty(authenticated_client: AsyncClient, test_user: dict):
    response = await authenticated_client.get(f"{TAGS_PREFIX}")
    assert response.status_code == 200
    data = response.json()
    assert data["tags"] == []
    assert data["total"] == 0


@pytest.mark.asyncio
async def test_list_tags_with_data(authenticated_client: AsyncClient, test_user: dict):
    await authenticated_client.post(
        f"{JOURNALS_PREFIX}",
        json={"title": "Entry", "content": "Content", "tags": ["personal", "growth"]},
    )

    response = await authenticated_client.get(f"{TAGS_PREFIX}")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    names = {t["name"] for t in data["tags"]}
    assert names == {"personal", "growth"}


@pytest.mark.asyncio
async def test_list_tags_prefix_search(authenticated_client: AsyncClient, test_user: dict):
    await authenticated_client.post(
        f"{JOURNALS_PREFIX}",
        json={"title": "Entry", "content": "Content", "tags": ["personal", "growth", "gratitude"]},
    )

    response = await authenticated_client.get(f"{TAGS_PREFIX}?q=gr")
    assert response.status_code == 200
    data = response.json()
    names = {t["name"] for t in data["tags"]}
    assert names == {"growth", "gratitude"}
    assert data["total"] == 2


@pytest.mark.asyncio
async def test_get_all_tags(authenticated_client: AsyncClient, test_user: dict):
    await authenticated_client.post(
        f"{JOURNALS_PREFIX}",
        json={"title": "Entry", "content": "Content", "tags": ["personal", "growth", "testing"]},
    )

    response = await authenticated_client.get(f"{TAGS_PREFIX}/all")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 3
    names = {t["name"] for t in data["tags"]}
    assert names == {"personal", "growth", "testing"}
    for t in data["tags"]:
        assert "usage_count" in t
        assert t["usage_count"] == 1
