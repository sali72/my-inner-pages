import os
import string
import json
import pytest
import httpx

from app.ai.config import AIModuleConfig
from app.ai.db.models import LLMProvider
from app.ai.db.repository import LLMProviderRepository


@pytest.fixture
def ai_config() -> AIModuleConfig:
    return AIModuleConfig()


@pytest.mark.asyncio
async def test_llm_providers_database_accessible(test_db_client):
    """Test that we can access the LLMProvider collection in the database."""
    # Ensure collection exists and count returns a valid number
    count = await LLMProvider.find_all().count()
    assert isinstance(count, int)


@pytest.mark.asyncio
async def test_llm_provider_reachable(ai_config: AIModuleConfig, test_db_client):
    """
    Test that configured LLM providers are reachable.
    Since tests run with fresh databases, we can seed a test provider for reachability checking if needed.
    """
    if ai_config.use_mock_llm:
        pytest.skip("USE_MOCK_LLM is enabled — no external LLM provider configured")

    repository = LLMProviderRepository()
    providers = await repository.get_all_providers()

    if not providers:
        # Seed a dummy provider to test database lookup and reachability logic structure
        dummy = LLMProvider(
            model_name="default",
            litellm_params={
                "model": "openrouter/google/gemini-flash-1.5:free",
                "api_base": "https://openrouter.ai/api/v1",
                "api_key": "${OPENROUTER_API_KEY}"
            },
            order=1,
            is_active=True
        )
        await dummy.insert()
        providers = [dummy]

    tested_any = False
    for p in providers:
        params = p.litellm_params
        api_base = params.api_base
        api_key_template = params.api_key or ""
        
        # Resolve env var template if any
        api_key = string.Template(api_key_template).safe_substitute(os.environ) if api_key_template else None
        if api_key and api_key.startswith("${") and api_key.endswith("}"):
            api_key = os.getenv(api_key[2:-1])

        if not api_base or not api_key:
            continue

        url = f"{api_base.rstrip('/')}/models"
        headers = {"Authorization": f"Bearer {api_key}"}

        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(url, headers=headers)

        assert response.status_code == 200, (
            f"Provider at {api_base} returned {response.status_code}. Expected 200."
        )
        tested_any = True
        break

    if not tested_any:
        pytest.skip("No provider with api_base and valid API key found in database")
