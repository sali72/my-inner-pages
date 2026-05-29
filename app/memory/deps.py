from fastapi import Depends
from app.memory.service import MemoryService
from app.memory.config import MemoryModuleConfig
from app.memory.db.repository import UserModelRepository
from app.memory.services.user_model_updater import UserModelUpdater
from app.journals.db.repository import JournalRepository
from app.journals.deps import get_journal_repository
from app.ai.deps import get_llm_client
from app.ai.integrations.openrouter_client import LLMClient


def get_memory_config() -> MemoryModuleConfig:
    return MemoryModuleConfig()


def get_user_model_repository() -> UserModelRepository:
    return UserModelRepository()


def get_memory_service(
    journal_repository: JournalRepository = Depends(get_journal_repository),
    user_model_repository: UserModelRepository = Depends(get_user_model_repository),
    config: MemoryModuleConfig = Depends(get_memory_config)
) -> MemoryService:
    return MemoryService(
        journal_repository=journal_repository,
        user_model_repository=user_model_repository,
        config=config
    )


def get_user_model_updater(
    user_model_repository: UserModelRepository = Depends(get_user_model_repository),
    journal_repository: JournalRepository = Depends(get_journal_repository),
    llm_client: LLMClient = Depends(get_llm_client),
    config: MemoryModuleConfig = Depends(get_memory_config),
) -> UserModelUpdater:
    return UserModelUpdater(
        user_model_repository=user_model_repository,
        journal_repository=journal_repository,
        llm_client=llm_client,
        config=config,
    )
