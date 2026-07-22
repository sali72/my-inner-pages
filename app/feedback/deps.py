from fastapi import Depends

from app.core.config import Settings
from app.core.deps.settings import get_settings
from app.feedback.facade.feedback_facade import FeedbackFacade
from app.journals.db.repository import JournalRepository
from app.journals.deps import get_journal_repository


def get_feedback_facade(
    journal_repository: JournalRepository = Depends(get_journal_repository),
    settings: Settings = Depends(get_settings),
) -> FeedbackFacade:
    return FeedbackFacade(
        journal_repository=journal_repository,
        settings=settings,
    )
