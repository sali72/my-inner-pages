from functools import lru_cache

from fastapi import Depends

from app.ai.config import AIModuleConfig
from app.ai.integrations.base import LLMClient
from app.ai.integrations.mock_llm_client import MockLLMClient
from app.ai.integrations.litellm_client import LiteLLMClient
from app.ai.services.chat_service import ChatService
from app.ai.services.mirror_service import MirrorService
from app.ai.ws.manager import ConnectionManager
from app.journals.deps import get_journal_repository
from app.journals.db.repository import JournalRepository
from app.memory.deps import get_memory_service
from app.memory.service import MemoryService


def get_ai_config() -> AIModuleConfig:
    """Get AI module configuration."""
    return AIModuleConfig()


def get_llm_client(
    config: AIModuleConfig = Depends(get_ai_config)
) -> LLMClient:
    if config.use_mock_llm:
        return MockLLMClient()

    return LiteLLMClient(
        providers_path=config.llm_providers_path,
        max_tokens=config.llm_max_tokens,
        temperature=config.llm_temperature,
        timeout=config.llm_timeout,
    )


def get_mirror_service(
    llm_client: LLMClient = Depends(get_llm_client),
    memory_service: MemoryService = Depends(get_memory_service),
    config: AIModuleConfig = Depends(get_ai_config)
) -> MirrorService:
    """Get mirror service with all dependencies injected."""
    return MirrorService(
        llm_client=llm_client,
        memory_service=memory_service,
        config=config
    )


@lru_cache
def get_connection_manager() -> ConnectionManager:
    return ConnectionManager()


def get_chat_service(
    llm_client: LLMClient = Depends(get_llm_client),
    memory_service: MemoryService = Depends(get_memory_service),
    journal_repository: JournalRepository = Depends(get_journal_repository),
    config: AIModuleConfig = Depends(get_ai_config),
) -> ChatService:
    return ChatService(
        llm_client=llm_client,
        memory_service=memory_service,
        journal_repository=journal_repository,
        config=config,
    )
