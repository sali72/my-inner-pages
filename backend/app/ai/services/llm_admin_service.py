import asyncio
import os
import string
import time
from typing import List, Optional

from app.ai.api.schemas.llm_admin import (
    ProviderConfigSchema,
    ProviderTestResult,
    DiagnosticsResponse,
)
from app.ai.config import AIModuleConfig
from app.ai.db.models import LLMProvider
from app.ai.db.repository import LLMProviderRepository
from app.core.logging import get_logger

logger = get_logger(__name__)


def obfuscate_api_key(key: Optional[str]) -> Optional[str]:
    """Obfuscate the API key or resolve and obfuscate the environment variable it references."""
    if not key:
        return None

    if key.startswith("${") and key.endswith("}"):
        env_var_name = key[2:-1]
        actual_val = os.getenv(env_var_name)
        if not actual_val:
            return f"{key} (Not Set)"
        resolved_obfuscated = obfuscate_raw_value(actual_val)
        return f"{key} ({resolved_obfuscated})"

    return obfuscate_raw_value(key)


def obfuscate_raw_value(val: str) -> str:
    """Obfuscate a raw string value leaving only a secure prefix/suffix."""
    if not val:
        return ""
    if len(val) <= 8:
        return "****"
    return f"{val[:6]}...{val[-4:]}"


def is_key_obfuscated(key: Optional[str]) -> bool:
    """Check if the provided key string is in an obfuscated format."""
    if not key:
        return False
    return "..." in key or "*" in key or "Not Set" in key


async def _probe_provider(index: int, provider_dict: dict) -> ProviderTestResult:
    """Helper function to test a provider deployment directly using litellm.acompletion."""
    litellm_params = provider_dict.get("litellm_params", {})
    raw_model = litellm_params.get("model", "")
    api_base = litellm_params.get("api_base", "")

    model = string.Template(raw_model).safe_substitute(os.environ)
    api_base_resolved = string.Template(api_base).safe_substitute(os.environ) if api_base else None

    api_key_template = litellm_params.get("api_key", "")
    api_key = string.Template(api_key_template).safe_substitute(os.environ) if api_key_template else None

    if api_key and api_key.startswith("${") and api_key.endswith("}"):
        env_var_name = api_key[2:-1]
        api_key = os.getenv(env_var_name)

    import litellm

    test_messages = [{"role": "user", "content": "Respond with the word 'pong' and nothing else."}]
    start_time = time.time()

    try:
        kwargs = {
            "model": model,
            "messages": test_messages,
            "max_tokens": 60,
            "timeout": 30,
        }
        if api_base_resolved:
            kwargs["api_base"] = api_base_resolved
        if api_key:
            kwargs["api_key"] = api_key

        response = await litellm.acompletion(**kwargs)
        latency = time.time() - start_time
        msg = response.choices[0].message
        content = getattr(msg, "content", None) or getattr(msg, "reasoning", None) or getattr(msg, "reasoning_content", None)
        response_text = (content or "").strip()

        if not response_text:
            return ProviderTestResult(
                index=index,
                model=model,
                status="FAILED",
                latency=latency,
                details="Error: Empty response received",
            )


        return ProviderTestResult(
            index=index,
            model=model,
            status="WORKING",
            latency=latency,
            details=f"Response: '{response_text}'",
        )
    except Exception as e:
        latency = time.time() - start_time
        error_msg = str(e).split("\n")[0]
        return ProviderTestResult(
            index=index,
            model=model,
            status="FAILED",
            latency=latency,
            details=f"Error: {error_msg}",
        )


class LLMAdminService:
    """Service handling administrative LLM provider configuration and diagnostics."""

    def __init__(self, config: AIModuleConfig, repository: LLMProviderRepository):
        self.config = config
        self.repository = repository

    async def get_providers(self) -> List[ProviderConfigSchema]:
        providers = await self.repository.get_all_providers()
        result = []
        for p in providers:
            params = p.litellm_params.model_dump(exclude_none=True)
            if "api_key" in params:
                params["api_key"] = obfuscate_api_key(params["api_key"])

            result.append(
                ProviderConfigSchema(
                    id=str(p.id),
                    model_name=p.model_name,
                    litellm_params=params,
                    order=p.order,
                    is_active=p.is_active,
                )
            )
        return result

    async def update_providers(self, providers_list: List[ProviderConfigSchema]) -> dict:
        existing_providers = await self.repository.get_all_providers()
        records_to_insert = []

        for new_p in providers_list:
            new_params = new_p.litellm_params.model_dump(exclude_none=True)
            new_key = new_params.get("api_key")

            if new_key and is_key_obfuscated(new_key):
                original_key = None

                if new_p.id:
                    for old_p in existing_providers:
                        if str(old_p.id) == new_p.id:
                            original_key = old_p.litellm_params.api_key
                            break

                if not original_key:
                    for old_p in existing_providers:
                        if (
                            old_p.litellm_params.model == new_params.get("model")
                            and old_p.litellm_params.api_base == new_params.get("api_base")
                        ):
                            original_key = old_p.litellm_params.api_key
                            break

                if original_key:
                    new_params["api_key"] = original_key
                else:
                    new_params.pop("api_key", None)

            doc = LLMProvider(
                model_name=new_p.model_name,
                litellm_params=new_params,
                order=new_p.order or 0,
                is_active=new_p.is_active,
            )
            records_to_insert.append(doc)

        await self.repository.replace_providers(records_to_insert)

        from app.ai.deps import reload_llm_client
        await reload_llm_client(self.config, self.repository)

        logger.info("admin_update_providers_db_success", count=len(records_to_insert))
        return {"status": "success", "message": "Providers updated in database and hot-reloaded successfully."}

    async def reload_providers(self) -> dict:
        from app.ai.deps import reload_llm_client
        await reload_llm_client(self.config, self.repository)
        return {"status": "success", "message": "LLM client reloaded successfully."}

    async def test_providers(self) -> DiagnosticsResponse:
        providers = await self.repository.get_all_providers()

        if not providers:
            return DiagnosticsResponse(total_models=0, working_models=0, failed_models=0, results=[])

        if self.config.use_mock_llm:
            results = [
                ProviderTestResult(
                    index=i + 1,
                    model=p.litellm_params.model if p.litellm_params and p.litellm_params.model else p.model_name,
                    status="WORKING",
                    latency=0.001,
                    details="Response: 'pong' (mock)",
                )
                for i, p in enumerate(providers)
            ]
            return DiagnosticsResponse(
                total_models=len(results),
                working_models=len(results),
                failed_models=0,
                results=results,
            )

        provider_dicts = [p.to_litellm_dict() for p in providers]
        tasks = [_probe_provider(i + 1, p) for i, p in enumerate(provider_dicts)]
        results = await asyncio.gather(*tasks)
        results.sort(key=lambda r: r.index)

        working_count = sum(1 for r in results if r.status == "WORKING")
        failed_count = len(results) - working_count

        return DiagnosticsResponse(
            total_models=len(results),
            working_models=working_count,
            failed_models=failed_count,
            results=results,
        )
