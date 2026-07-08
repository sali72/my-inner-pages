from abc import ABC, abstractmethod
from collections.abc import AsyncGenerator
from typing import Optional


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
