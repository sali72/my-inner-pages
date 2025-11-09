from fastapi import Depends
from app.journals.facade.journal_facade import JournalFacade
from app.journals.db.repository import JournalRepository
from app.journals.config import JournalModuleConfig


def get_journal_config() -> JournalModuleConfig:
    """Get journal module configuration."""
    return JournalModuleConfig()


def get_journal_repository() -> JournalRepository:
    """Get journal repository."""
    return JournalRepository()


def get_journal_facade(
    repository: JournalRepository = Depends(get_journal_repository),
    config: JournalModuleConfig = Depends(get_journal_config)
) -> JournalFacade:
    """Get journal facade with all dependencies injected."""
    return JournalFacade(repository=repository, config=config)
