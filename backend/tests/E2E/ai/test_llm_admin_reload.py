import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio

async def test_unauthenticated_cannot_reload(client: AsyncClient):
    response = await client.post("/api/v0/admin/llm/reload")
    assert response.status_code == 401

async def test_non_admin_cannot_reload(authenticated_client: AsyncClient):
    response = await authenticated_client.post("/api/v0/admin/llm/reload")
    assert response.status_code == 403

async def test_admin_can_force_reload(admin_client: AsyncClient):
    response = await admin_client.post("/api/v0/admin/llm/reload")
    assert response.status_code == 200
    assert response.json()["status"] == "success"
