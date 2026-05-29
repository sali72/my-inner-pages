from collections.abc import AsyncGenerator

from app.ai.config import AIModuleConfig
from app.ai.integrations.openrouter_client import LLMClient
from app.ai.prompts.chat import build_system_prompt as format_system_prompt
from app.ai.prompts.chat import format_conversation_prompt
from app.core.logging import get_logger
from app.memory.service import MemoryService

logger = get_logger(__name__)


class ChatService:
    def __init__(
        self,
        llm_client: LLMClient,
        memory_service: MemoryService,
        config: AIModuleConfig,
    ) -> None:
        self.llm_client = llm_client
        self.memory_service = memory_service
        self.config = config

    async def build_system_prompt(self, user_id: str, history: list[dict] | None = None) -> str:
        context = await self.memory_service.build_injected_context(
            user_id=user_id, chat_history=history
        )
        return format_system_prompt(context)

    async def chat_stream(
        self,
        system_prompt: str,
        user_message: str,
        history: list[dict],
    ) -> AsyncGenerator[dict, None]:
        prompt = format_conversation_prompt(user_message, history)

        async for token in self.llm_client.generate_stream(
            prompt=prompt,
            system_prompt=system_prompt,
            max_tokens=self.config.chat_max_tokens,
            temperature=self.config.chat_temperature,
        ):
            yield {"type": "token", "content": token}

        yield {"type": "done", "content": ""}
