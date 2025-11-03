from typing import Optional
from app.journals.db.repository import JournalRepository
from app.journals.db.models import Journal
from app.memory.config import MemoryModuleConfig
from app.core.logging import get_logger

logger = get_logger(__name__)


class MemoryService:
    """
    Service for retrieving user context and memory.
    Handles fetching relevant journals and building context for AI operations.
    """
    
    def __init__(self, repository: Optional[JournalRepository] = None):
        self.repository = repository or JournalRepository()
        self.config = MemoryModuleConfig()
    
    async def get_recent_journals(
        self, 
        user_id: str, 
        limit: int = None
    ) -> list[Journal]:
        """
        Retrieve recent journals for a user.
        
        Args:
            user_id: User ID
            limit: Number of journals to retrieve (defaults to config value)
            
        Returns:
            List of recent journal entries
        """
        if limit is None:
            limit = self.config.default_context_limit
        
        # Ensure limit doesn't exceed maximum
        limit = min(limit, self.config.max_context_limit)
        
        logger.info("fetching_journals", user_id=user_id, limit=limit)
        
        journals = await self.repository.find_all_by_user(
            user_id=user_id,
            skip=0,
            limit=limit
        )
        
        logger.info("journals_fetched", user_id=user_id, count=len(journals))
        return journals
    
    async def build_journal_context(
        self,
        user_id: str,
        limit: int = None
    ) -> str:
        """
        Build a text context from recent journals for AI processing.
        
        Args:
            user_id: User ID
            limit: Number of journals to include
            
        Returns:
            Formatted string containing journal context
        """
        logger.info("building_journal_context", user_id=user_id, limit=limit)
        
        journals = await self.get_recent_journals(user_id, limit)
        
        if not journals:
            logger.info("no_journals_found", user_id=user_id)
            return "No journal entries available yet."
        
        logger.info("building_context_from_journals", journal_count=len(journals))
        
        context_parts = []
        for i, journal in enumerate(journals, 1):
            context_parts.append(
                f"Entry {i} ({journal.created_at.strftime('%Y-%m-%d')}):\n"
                f"Title: {journal.title}\n"
                f"Content: {journal.content}\n"
                f"Tags: {', '.join(journal.tags) if journal.tags else 'None'}\n"
            )
        
        context = "\n---\n".join(context_parts)
        logger.info("context_built", total_length=len(context))
        
        return context
