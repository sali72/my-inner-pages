from fastapi import Depends
from app.memory.service import MemoryService
from app.memory.config import MemoryModuleConfig
from app.journals.db.repository import JournalRepository
from app.journals.deps import get_journal_repository


def get_memory_config() -> MemoryModuleConfig:
    """Get memory module configuration."""
    return MemoryModuleConfig()


def get_memory_service(
    repository: JournalRepository = Depends(get_journal_repository),
    config: MemoryModuleConfig = Depends(get_memory_config)
) -> MemoryService:
    """Get memory service with all dependencies injected."""
    return MemoryService(repository=repository, config=config)
