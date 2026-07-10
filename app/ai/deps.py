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


from app.ai.db.repository import LLMProviderRepository
import json
import structlog

logger = structlog.get_logger(__name__)


def get_llm_provider_repository() -> LLMProviderRepository:
    """Get LLM provider repository."""
    return LLMProviderRepository()


@lru_cache(maxsize=1)
def get_cached_litellm_client(
    model_list_tuple: tuple[str, ...],
    max_tokens: int,
    temperature: float,
    timeout: int,
) -> LiteLLMClient:
    """Cached factory function for LiteLLMClient using standard lru_cache."""
    model_list = [json.loads(m) for m in model_list_tuple]
    return LiteLLMClient(
        model_list=model_list,
        max_tokens=max_tokens,
        temperature=temperature,
        timeout=timeout,
    )


async def get_llm_client(
    config: AIModuleConfig = Depends(get_ai_config),
    repository: LLMProviderRepository = Depends(get_llm_provider_repository),
) -> LLMClient:
    if config.use_mock_llm:
        return MockLLMClient()

    # Query active providers from the database repository
    providers = await repository.get_active_providers()
    model_list = [p.to_litellm_dict() for p in providers]

    if not model_list:
        logger.warning("no_active_llm_providers_configured_falling_back_to_mock")
        return MockLLMClient()

    # Convert list of configs to a hashable tuple of sorted JSON strings
    model_list_tuple = tuple(json.dumps(m, sort_keys=True) for m in model_list)

    return get_cached_litellm_client(
        model_list_tuple=model_list_tuple,
        max_tokens=config.llm_max_tokens,
        temperature=config.llm_temperature,
        timeout=config.llm_timeout,
    )


async def reload_llm_client(
    config: AIModuleConfig,
    repository: LLMProviderRepository,
) -> LiteLLMClient:
    """Clear the lru_cache and return a re-instantiated LiteLLMClient."""
    get_cached_litellm_client.cache_clear()
    return await get_llm_client(config, repository)


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
