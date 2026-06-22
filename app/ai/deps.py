from functools import lru_cache

from fastapi import Depends

from app.ai.config import AIModuleConfig
from app.ai.integrations.mock_llm_client import MockLLMClient
from app.ai.integrations.openrouter_client import LLMClient, OpenRouterClient
from app.ai.services.chat_service import ChatService
from app.ai.services.mirror_service import MirrorService
from app.ai.ws.manager import ConnectionManager
from app.core.config import Settings
from app.core.deps.settings import get_settings
from app.journals.deps import get_journal_repository
from app.journals.db.repository import JournalRepository
from app.memory.deps import get_memory_service
from app.memory.service import MemoryService


def get_ai_config() -> AIModuleConfig:
    """Get AI module configuration."""
    return AIModuleConfig()


def get_llm_client(
    settings: Settings = Depends(get_settings),
    config: AIModuleConfig = Depends(get_ai_config)
) -> LLMClient:
    """
    Get LLM client configured via AIModuleConfig.
    
    Returns MockLLMClient if use_mock_llm is True,
    otherwise returns OpenRouterClient with fallback chain.
    """
    if config.use_mock_llm:
        return MockLLMClient()
    
    return OpenRouterClient(
        api_key=config.openrouter_api_key,
        model=config.llm_model,
        fallback_models=config.llm_fallback_models,
        base_url=config.llm_base_url,
        max_tokens=config.llm_max_tokens,
        temperature=config.llm_temperature,
        app_name=settings.app_name
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
