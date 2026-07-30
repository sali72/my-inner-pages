import pytest
from httpx import AsyncClient
from app.ai.db.models import LLMProvider

pytestmark = pytest.mark.asyncio

async def test_unauthenticated_cannot_update_providers(client: AsyncClient):
    response = await client.put("/api/v0/admin/llm/providers", json=[])
    assert response.status_code == 401

async def test_non_admin_cannot_update_providers(authenticated_client: AsyncClient):
    response = await authenticated_client.put("/api/v0/admin/llm/providers", json=[])
    assert response.status_code == 403

async def test_admin_can_update_providers(admin_client: AsyncClient):
    payload = [
        {
            "model_name": "New Model",
            "litellm_params": {"model": "openai/gpt-3.5-turbo", "api_key": "new_key_123"},
            "order": 1,
            "is_active": True
        }
    ]
    response = await admin_client.put("/api/v0/admin/llm/providers", json=payload)
    assert response.status_code == 200
    
    # Check DB to ensure the literal key was saved
    providers = await LLMProvider.find_all().to_list()
    assert len(providers) == 1
    assert providers[0].litellm_params.api_key == "new_key_123"

async def test_admin_update_preserves_obfuscated_keys(admin_client: AsyncClient):
    """
    CRITICAL EDGE CASE: If the frontend sends back an obfuscated key (e.g. sk-...ab),
    the backend MUST look up the original key and preserve it, rather than saving the literal '...'.
    """
    # 1. Seed database with a raw secret key
    provider = LLMProvider(
        model_name="Preserve Model",
        litellm_params={"model": "gpt-4", "api_key": "very_long_real_secret_key"},
        order=1,
        is_active=True
    )
    await provider.insert()
    
    # 2. Simulate the frontend sending an update payload with an obfuscated key string
    payload = [
        {
            "model_name": "Preserve Model",
            "litellm_params": {"model": "gpt-4", "api_key": "very_l..._key"},
            "order": 1,
            "is_active": True
        }
    ]
    response = await admin_client.put("/api/v0/admin/llm/providers", json=payload)
    assert response.status_code == 200
    
    # 3. Check DB to ensure the original raw key was PRESERVED
    providers = await LLMProvider.find_all().to_list()
    assert len(providers) == 1
    assert providers[0].litellm_params.api_key == "very_long_real_secret_key"

async def test_admin_can_clear_providers(admin_client: AsyncClient):
    """Test that an empty array successfully deletes all providers."""
    # Seed first
    provider = LLMProvider(model_name="T", litellm_params={"model": "t"}, order=1, is_active=True)
    await provider.insert()
    
    response = await admin_client.put("/api/v0/admin/llm/providers", json=[])
    assert response.status_code == 200
    
    providers = await LLMProvider.find_all().to_list()
    assert len(providers) == 0
