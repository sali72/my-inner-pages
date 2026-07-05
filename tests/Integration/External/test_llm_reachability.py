import os

import httpx
import pytest

from app.ai.config import AIModuleConfig


@pytest.fixture
def ai_config() -> AIModuleConfig:
    return AIModuleConfig()


@pytest.mark.asyncio
async def test_llm_base_url_dns_resolves(ai_config: AIModuleConfig):
    import socket
    from urllib.parse import urlparse

    hostname = urlparse(ai_config.llm_base_url).hostname
    assert hostname is not None, "Could not extract hostname from llm_base_url"

    try:
        socket.getaddrinfo(hostname, 443)
    except socket.gaierror:
        pytest.fail(f"DNS resolution failed for {hostname}")


@pytest.mark.asyncio
async def test_llm_models_endpoint_reachable(ai_config: AIModuleConfig):
    if ai_config.use_mock_llm:
        pytest.skip("USE_MOCK_LLM is enabled — no external LLM provider configured")

    if not ai_config.openrouter_api_key:
        pytest.skip("No OPENROUTER_API_KEY set — skipping reachability check")

    url = f"{ai_config.llm_base_url.rstrip('/')}/models"
    headers = {"Authorization": f"Bearer {ai_config.openrouter_api_key}"}

    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(url, headers=headers)

    assert response.status_code == 200, (
        f"LLM provider at {ai_config.llm_base_url} returned "
        f"{response.status_code}. Expected 200."
    )


@pytest.mark.asyncio
async def test_llm_config_has_api_key_when_not_mock(ai_config: AIModuleConfig):
    if ai_config.use_mock_llm:
        pytest.skip("USE_MOCK_LLM is enabled — no API key required")

    assert ai_config.openrouter_api_key, (
        "OPENROUTER_API_KEY is not set but USE_MOCK_LLM is disabled. "
        "Either set the API key or enable USE_MOCK_LLM=true."
    )
