import json
import os
import string
from collections.abc import AsyncGenerator
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
load_dotenv()

from litellm import Router

from app.ai.integrations.base import LLMClient
from app.core.logging import get_logger

logger = get_logger(__name__)


class LiteLLMClient(LLMClient):
    """LLM client with multi-provider failover via LiteLLM Router."""

    def __init__(
        self,
        providers_path: str = "llm_providers.json",
        max_tokens: int = 500,
        temperature: float = 0.7,
        timeout: int = 30,
    ):
        self.default_max_tokens = max_tokens
        self.default_temperature = temperature

        model_list = self._load_providers(providers_path)
        if not model_list:
            raise ValueError(f"No providers configured in {providers_path}")

        self.router = Router(
            model_list=model_list,
            num_retries=2,
            timeout=timeout,
            retry_after=True,
            enable_pre_call_checks=True,
            enable_weighted_failover=True,
        )

        provider_names = [d.get("litellm_params", {}).get("model", "?") for d in model_list]
        logger.info(
            "litellm_router_created",
            providers=provider_names,
            total_deployments=len(model_list),
        )

    def _load_providers(self, providers_path: str) -> list[dict]:
        path = Path(providers_path)
        if not path.is_absolute():
            path = Path(os.getcwd()) / path

        if not path.exists():
            logger.error("providers_file_not_found", path=str(path))
            raise FileNotFoundError(f"LLM providers config not found: {path}")

        with open(path) as f:
            raw_content = f.read()

        resolved_content = string.Template(raw_content).safe_substitute(os.environ)
        providers = json.loads(resolved_content)
        logger.info("providers_loaded", path=str(path), count=len(providers))
        return providers

    def _build_messages(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
    ) -> list[dict]:
        messages: list[dict] = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        return messages

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 500,
        temperature: float = 0.7,
    ) -> str:
        logger.info("generate_start", max_tokens=max_tokens, temperature=temperature)
        messages = self._build_messages(prompt, system_prompt)

        try:
            response = await self.router.acompletion(
                model="default",
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
            )
            text = response.choices[0].message.content
            logger.info("generation_success", text_length=len(text))
            return text
        except Exception as e:
            logger.error(
                "generation_failed",
                error=str(e),
                error_type=type(e).__name__,
            )
            raise

    async def generate_stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 500,
        temperature: float = 0.7,
    ) -> AsyncGenerator[str, None]:
        logger.info("generate_stream_start", max_tokens=max_tokens, temperature=temperature)
        messages = self._build_messages(prompt, system_prompt)

        try:
            response = await self.router.acompletion(
                model="default",
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
                stream=True,
            )
            async for chunk in response:
                content = chunk.choices[0].delta.content
                if content:
                    yield content
            logger.info("generate_stream_success")
        except Exception as e:
            logger.error(
                "stream_failed",
                error=str(e),
                error_type=type(e).__name__,
            )
            raise
