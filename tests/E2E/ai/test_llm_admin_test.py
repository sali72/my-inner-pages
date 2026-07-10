import pytest
from httpx import AsyncClient
from app.ai.db.models import LLMProvider

pytestmark = pytest.mark.asyncio

async def test_unauthenticated_cannot_test_providers(client: AsyncClient):
    response = await client.post("/api/v0/admin/llm/test")
    assert response.status_code == 403

async def test_non_admin_cannot_test_providers(authenticated_client: AsyncClient):
    response = await authenticated_client.post("/api/v0/admin/llm/test")
    assert response.status_code == 403

async def test_admin_test_providers_empty_database(admin_client: AsyncClient):
    """Test diagnostics run gracefully when the DB has no providers."""
    response = await admin_client.post("/api/v0/admin/llm/test")
    assert response.status_code == 200
    data = response.json()
    assert data["total_models"] == 0
    assert data["working_models"] == 0
    assert data["failed_models"] == 0
    assert data["results"] == []

async def test_admin_test_providers_with_data(admin_client: AsyncClient):
    """Test diagnostics runs on configured providers."""
    # Add a mock provider
    provider = LLMProvider(
        model_name="Test Model",
        litellm_params={"model": "openai/gpt-3.5-turbo", "api_key": "fake_key"},
        order=1,
        is_active=True
    )
    await provider.insert()
    
    response = await admin_client.post("/api/v0/admin/llm/test")
    assert response.status_code == 200
    data = response.json()
    
    assert data["total_models"] == 1
    assert "results" in data
    assert len(data["results"]) == 1
    assert data["results"][0]["model"] == "openai/gpt-3.5-turbo"
