from functools import lru_cache

from fastapi import Depends

from app.ai.config import AIModuleConfig
from app.ai.integrations.base import LLMClient
from app.ai.integrations.mock_llm_client import MockLLMClient
from app.ai.integrations.litellm_client import LiteLLMClient
from app.ai.services.chat_service import ChatService
from app.ai.services.mirror_service import MirrorService
from app.ai.ws.dedup import MessageDedupStore
from app.ai.ws.generation_manager import GenerationManager
from app.ai.ws.manager import ConnectionManager
from app.journals.deps import get_journal_repository
from app.journals.db.repository import JournalRepository
from app.memory.deps import get_memory_service
from app.memory.service import MemoryService


def get_ai_config() -> AIModuleConfig:
    """Get AI module configuration."""
    return AIModuleConfig()


import json
import time
import structlog
from app.ai.db.repository import LLMProviderRepository

logger = structlog.get_logger(__name__)

_cached_providers: list | None = None
_cached_providers_at: float = 0
_PROVIDER_CACHE_TTL = 30  # seconds

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


@lru_cache
def get_message_dedup_store() -> MessageDedupStore:
    config = get_ai_config()
    return MessageDedupStore(ttl=config.ws_message_dedup_ttl)


def get_generation_manager(
    config: AIModuleConfig = Depends(get_ai_config),
    dedup_store: MessageDedupStore = Depends(get_message_dedup_store),
) -> GenerationManager:
    return GenerationManager(
        grace_period=config.ws_generation_grace_period,
        dedup_store=dedup_store,
    )


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
