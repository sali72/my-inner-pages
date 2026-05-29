from abc import ABC, abstractmethod
from collections.abc import AsyncGenerator
from typing import Optional

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage

from app.core.logging import get_logger

logger = get_logger(__name__)


class LLMClient(ABC):
    """Abstract base class for LLM clients."""

    @abstractmethod
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 500,
        temperature: float = 0.7,
    ) -> str:
        """Generate completion from LLM."""
        pass

    @abstractmethod
    async def generate_stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 500,
        temperature: float = 0.7,
    ) -> AsyncGenerator[str, None]:
        """Generate streaming completion from LLM, yielding tokens."""
        if False:
            yield


class OpenRouterClient(LLMClient):
    """OpenRouter LLM client with manual model fallback."""

    def __init__(
        self,
        api_key: str,
        model: str,
        fallback_models: list[str],
        base_url: str,
        max_tokens: int = 500,
        temperature: float = 0.7,
        app_name: str = "my-inner-pages"
    ):
        if not api_key:
            logger.error("api_key_empty")
            raise ValueError("API key is required")

        self.api_key = api_key
        self.base_url = base_url
        self.app_name = app_name
        self.model = model
        self.fallback_models = fallback_models
        self.default_max_tokens = max_tokens
        self.default_temperature = temperature

        self._extra_headers = {
            "HTTP-Referer": self.app_name,
            "X-Title": self.app_name,
        }

        self._all_models = [model] + (fallback_models or [])
        self._llms = [self._build_llm(m, max_tokens, temperature) for m in self._all_models]

        logger.info(
            "openrouter_client_created",
            model=model,
            fallback_count=len(fallback_models or []),
            total_models=len(self._all_models),
        )

    def _build_llm(self, model: str, max_tokens: int, temperature: float) -> ChatOpenAI:
        return ChatOpenAI(
            model=model,
            openai_api_base=self.base_url,
            openai_api_key=self.api_key,
            max_tokens=max_tokens,
            temperature=temperature,
            model_kwargs={"extra_headers": self._extra_headers},
        )

    def _get_llms(self, max_tokens: int, temperature: float) -> list[ChatOpenAI]:
        if max_tokens != self.default_max_tokens or temperature != self.default_temperature:
            return [self._build_llm(m, max_tokens, temperature) for m in self._all_models]
        return self._llms

    def _build_messages(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
    ) -> list:
        messages: list = []
        if system_prompt:
            messages.append(SystemMessage(content=system_prompt))
        messages.append(HumanMessage(content=prompt))
        return messages

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 500,
        temperature: float = 0.7
    ) -> str:
        logger.info("generate_start", max_tokens=max_tokens, temperature=temperature)
        messages = self._build_messages(prompt, system_prompt)
        llms = self._get_llms(max_tokens, temperature)
        last_error: Optional[Exception] = None

        for i, llm in enumerate(llms):
            model_name = self._all_models[i]
            try:
                logger.info(
                    "model_attempt",
                    model=model_name,
                    attempt=i + 1,
                    total=len(llms),
                )
                response = await llm.ainvoke(messages)
                generated_text = response.content
                logger.info(
                    "generation_success",
                    model=model_name,
                    text_length=len(generated_text),
                )
                return generated_text
            except Exception as e:
                logger.warning(
                    "model_failed",
                    model=model_name,
                    attempt=i + 1,
                    error=str(e),
                    error_type=type(e).__name__,
                )
                last_error = e

        logger.error("all_models_failed", errors=str(last_error))
        raise Exception(f"All {len(llms)} model(s) failed. Last error: {last_error}")

    async def generate_stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 500,
        temperature: float = 0.7,
    ) -> AsyncGenerator[str, None]:
        logger.info("generate_stream_start", max_tokens=max_tokens, temperature=temperature)
        messages = self._build_messages(prompt, system_prompt)
        llms = self._get_llms(max_tokens, temperature)
        last_error: Optional[Exception] = None

        for i, llm in enumerate(llms):
            model_name = self._all_models[i]
            try:
                logger.info(
                    "model_stream_attempt",
                    model=model_name,
                    attempt=i + 1,
                    total=len(llms),
                )
                async for chunk in llm.astream(messages):
                    if chunk.content:
                        yield chunk.content

                logger.info("generate_stream_success", model=model_name)
                return
            except Exception as e:
                logger.warning(
                    "model_stream_failed",
                    model=model_name,
                    attempt=i + 1,
                    error=str(e),
                    error_type=type(e).__name__,
                )
                last_error = e

        logger.error("all_models_failed", errors=str(last_error))
        raise Exception(f"All {len(llms)} model(s) failed. Last error: {last_error}")
