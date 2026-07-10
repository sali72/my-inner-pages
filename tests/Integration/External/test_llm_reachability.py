import json
from pathlib import Path

import pytest

from app.ai.config import AIModuleConfig


@pytest.fixture
def ai_config() -> AIModuleConfig:
    return AIModuleConfig()


@pytest.mark.asyncio
async def test_llm_providers_file_exists(ai_config: AIModuleConfig):
    path = Path(ai_config.llm_providers_path)
    if not path.is_absolute():
        import os
        path = Path(os.getcwd()) / path

    assert path.exists(), (
        f"LLM providers config not found at {path}. "
        f"Create it or set LLM_PROVIDERS_PATH to the correct path."
    )


@pytest.mark.asyncio
async def test_llm_providers_file_valid_json(ai_config: AIModuleConfig):
    path = Path(ai_config.llm_providers_path)
    if not path.is_absolute():
        import os
        path = Path(os.getcwd()) / path

    if not path.exists():
        pytest.skip("LLM providers config file not found")

    with open(path) as f:
        providers = json.load(f)

    assert isinstance(providers, list), "providers config must be a JSON array"
    assert len(providers) > 0, "providers config must have at least one entry"

    for i, p in enumerate(providers):
        assert "model_name" in p, f"Provider {i} missing 'model_name'"
        assert "litellm_params" in p, f"Provider {i} missing 'litellm_params'"
        assert "model" in p["litellm_params"], f"Provider {i} missing 'litellm_params.model'"


@pytest.mark.asyncio
async def test_llm_provider_reachable(ai_config: AIModuleConfig):
    if ai_config.use_mock_llm:
        pytest.skip("USE_MOCK_LLM is enabled — no external LLM provider configured")

    path = Path(ai_config.llm_providers_path)
    if not path.is_absolute():
        import os
        path = Path(os.getcwd()) / path

    if not path.exists():
        pytest.skip("LLM providers config file not found")

    with open(path) as f:
        import string
        content = string.Template(f.read()).safe_substitute(os.environ)
        providers = json.loads(content)

    import httpx

    tested_any = False
    for p in providers:
        params = p.get("litellm_params", {})
        api_base = params.get("api_base")
        api_key = params.get("api_key", "")

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
        pytest.skip("No provider with api_base and valid API key found")
