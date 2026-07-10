import json
import os
import string
from collections.abc import AsyncGenerator
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
load_dotenv()

from app.ai.integrations.base import LLMClient
from app.core.logging import get_logger

logger = get_logger(__name__)


class LiteLLMClient(LLMClient):
    """LLM client with multi-provider failover via LiteLLM Router."""

    def __init__(
        self,
        model_list: list[dict],
        max_tokens: int = 500,
        temperature: float = 0.7,
        timeout: int = 30,
    ):
        self.default_max_tokens = max_tokens
        self.default_temperature = temperature
        self.timeout = timeout

        from litellm import Router

        resolved_model_list = self._resolve_env_placeholders(model_list)
        if not resolved_model_list:
            raise ValueError("No providers configured in the model list")

        self.router = Router(
            model_list=resolved_model_list,
            num_retries=2,
            timeout=timeout,
            retry_after=True,
            enable_pre_call_checks=True,
            enable_weighted_failover=True,
        )

        provider_names = [d.get("litellm_params", {}).get("model", "?") for d in resolved_model_list]
        logger.info(
            "litellm_router_created",
            providers=provider_names,
            total_deployments=len(resolved_model_list),
        )

    def _resolve_env_placeholders(self, model_list: list[dict]) -> list[dict]:
        raw_json = json.dumps(model_list)
        resolved_json = string.Template(raw_json).safe_substitute(os.environ)
        return json.loads(resolved_json)

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
