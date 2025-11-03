from typing import Optional
from app.journals.db.repository import JournalRepository
from app.journals.db.models import Journal
from app.memory.config import MemoryModuleConfig


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
        
        return await self.repository.find_all_by_user(
            user_id=user_id,
            skip=0,
            limit=limit
        )
    
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
        journals = await self.get_recent_journals(user_id, limit)
        
        if not journals:
            return "No journal entries available yet."
        
        context_parts = []
        for i, journal in enumerate(journals, 1):
            context_parts.append(
                f"Entry {i} ({journal.created_at.strftime('%Y-%m-%d')}):\n"
                f"Title: {journal.title}\n"
                f"Content: {journal.content}\n"
                f"Tags: {', '.join(journal.tags) if journal.tags else 'None'}\n"
            )
        
        return "\n---\n".join(context_parts)
