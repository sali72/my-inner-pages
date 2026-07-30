import pytest
from httpx import AsyncClient
from app.ai.db.models import LLMProvider

pytestmark = pytest.mark.asyncio

async def test_unauthenticated_cannot_access_get_providers(client: AsyncClient):
    """Test that a request without any auth token is rejected."""
    response = await client.get("/api/v0/admin/llm/providers")
    assert response.status_code == 401

async def test_non_admin_cannot_access_get_providers(authenticated_client: AsyncClient):
    """Test that a regular authenticated user cannot access the admin providers endpoint."""
    response = await authenticated_client.get("/api/v0/admin/llm/providers")
    assert response.status_code == 403
    assert "privilege" in response.json()["detail"].lower()

async def test_admin_can_access_get_providers_empty(admin_client: AsyncClient):
    """Test fetching providers when the database is completely empty."""
    response = await admin_client.get("/api/v0/admin/llm/providers")
    assert response.status_code == 200
    assert response.json() == []

async def test_admin_can_access_get_providers_with_data(admin_client: AsyncClient):
    """Test that fetching providers obfuscates API keys."""
    # Seed DB with a real raw key
    provider = LLMProvider(
        model_name="Secure Model",
        litellm_params={"model": "gpt-4", "api_key": "secret_key_12345678"},
        order=1,
        is_active=True
    )
    await provider.insert()
    
    response = await admin_client.get("/api/v0/admin/llm/providers")
    assert response.status_code == 200
    data = response.json()
    
    assert len(data) == 1
    assert data[0]["model_name"] == "Secure Model"
    
    # Key must be obfuscated in the response payload!
    returned_key = data[0]["litellm_params"]["api_key"]
    assert "secret_key_12345678" not in returned_key
    assert "..." in returned_key
