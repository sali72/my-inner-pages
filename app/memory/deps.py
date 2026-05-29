from fastapi import Depends
from app.memory.service import MemoryService
from app.memory.config import MemoryModuleConfig
from app.memory.db.repository import UserModelRepository
from app.memory.services.user_model_updater import UserModelUpdater
from app.journals.db.repository import JournalRepository
from app.journals.deps import get_journal_repository


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


def _get_llm_client():
    from app.ai.deps import get_llm_client as _ai_get_llm_client
    from app.core.deps.settings import get_settings
    from app.ai.config import AIModuleConfig
    return _ai_get_llm_client(
        settings=get_settings(),
        config=AIModuleConfig(),
    )


def get_user_model_updater(
    user_model_repository: UserModelRepository = Depends(get_user_model_repository),
    journal_repository: JournalRepository = Depends(get_journal_repository),
    llm_client=Depends(_get_llm_client),
    config: MemoryModuleConfig = Depends(get_memory_config),
) -> UserModelUpdater:
    return UserModelUpdater(
        user_model_repository=user_model_repository,
        journal_repository=journal_repository,
        llm_client=llm_client,
        config=config,
    )
