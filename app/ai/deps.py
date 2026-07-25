import json
import time
from functools import lru_cache

import structlog
from fastapi import Depends

from app.ai.config import AIModuleConfig
from app.ai.db.repository import LLMProviderRepository
from app.ai.facade.chat_facade import ChatFacade
from app.ai.integrations.base import LLMClient
from app.ai.integrations.litellm_client import LiteLLMClient
from app.ai.integrations.mock_llm_client import MockLLMClient
from app.ai.services.chat_service import ChatService
from app.ai.services.mirror_service import MirrorService
from app.chat.deps import get_chat_facade
from app.chat.facade import ChatPersistenceFacade
from app.journals.db.repository import JournalRepository
from app.journals.deps import get_journal_repository
from app.memory.deps import get_memory_facade
from app.memory.facade import MemoryFacade

logger = structlog.get_logger(__name__)

_cached_providers: list | None = None
_cached_providers_at: float = 0
_PROVIDER_CACHE_TTL = 30  # seconds


def get_ai_config() -> AIModuleConfig:
    """Get AI module configuration."""
    return AIModuleConfig()


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

    global _cached_providers, _cached_providers_at
    now = time.time()
    if _cached_providers is None or now - _cached_providers_at > _PROVIDER_CACHE_TTL:
        _cached_providers = await repository.get_active_providers()
        _cached_providers_at = now

    providers = _cached_providers
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
    """Clear both caches and return a re-instantiated LiteLLMClient."""
    global _cached_providers
    _cached_providers = None
    get_cached_litellm_client.cache_clear()
    return await get_llm_client(config, repository)


def get_mirror_service(
    llm_client: LLMClient = Depends(get_llm_client),
    memory_service: MemoryFacade = Depends(get_memory_facade),
    config: AIModuleConfig = Depends(get_ai_config),
) -> MirrorService:
    """Get mirror service with all dependencies injected."""
    return MirrorService(
        llm_client=llm_client,
        memory_service=memory_service,
        config=config,
    )


def get_chat_service(
    llm_client: LLMClient = Depends(get_llm_client),
    memory_service: MemoryFacade = Depends(get_memory_facade),
    journal_repository: JournalRepository = Depends(get_journal_repository),
    config: AIModuleConfig = Depends(get_ai_config),
) -> ChatService:
    return ChatService(
        llm_client=llm_client,
        memory_service=memory_service,
        journal_repository=journal_repository,
        config=config,
    )


def get_chat_facade(
    chat_service: ChatService = Depends(get_chat_service),
    chat_persistence: ChatPersistenceFacade = Depends(get_chat_facade),
    config: AIModuleConfig = Depends(get_ai_config),
) -> ChatFacade:
    return ChatFacade(
        chat_service=chat_service,
        chat_persistence=chat_persistence,
        config=config,
    )
