from typing import Optional
from datetime import datetime
from beanie import PydanticObjectId

from app.ai.rumination import compute_rumination_index
from app.journals.db.models import Journal
from app.journals.db.repository import JournalRepository
from app.journals.config import JournalModuleConfig


class JournalFacade:
    """
    Facade for journal business logic and orchestration.
    Coordinates between repository and applies business rules.
    """
    
    def __init__(self, repository: JournalRepository, config: JournalModuleConfig):
        self.repository = repository
        self.config = config
    
    async def create_journal(
        self,
        user_id: str,
        title: Optional[str],
        content: str,
        tags: Optional[list[str]] = None,
        created_at: Optional[datetime] = None,
    ) -> Journal:
        """
        Create a new journal entry for a user with business validation.
        
        Args:
            user_id: User ID who owns this journal
            title: Journal title (optional, None allowed)
            content: Journal content
            tags: Optional list of tags
            created_at: Optional creation date override
            
        Returns:
            Created journal
            
        Raises:
            ValueError: If validation fails
        """
        if title is not None:
            self._validate_title(title)
        self._validate_content(content)
        
        # Normalize tags
        normalized_tags = self._normalize_tags(tags or [])
        
        # Compute real-time rumination signal
        rumination_index = compute_rumination_index(content)
        
        return await self.repository.create(
            user_id=user_id,
            title=title.strip() if title else title,
            content=content.strip(),
            tags=normalized_tags,
            rumination_index=rumination_index,
            created_at=created_at,
        )
    
    async def get_journal(self, journal_id: str, user_id: str) -> Optional[Journal]:
        """
        Get a journal by ID for a specific user.
        
        Args:
            journal_id: Journal ID string
            user_id: User ID who owns the journal
            
        Returns:
            Journal or None if not found
            
        Raises:
            ValueError: If journal_id is not a valid ObjectId
        """
        from app.core.validators import validate_object_id
        
        obj_id = validate_object_id(journal_id, "journal_id")
        return await self.repository.find_by_id(obj_id, user_id)
    
    async def list_journals(
        self,
        user_id: str,
        cursor: Optional[str] = None,
        page_size: int = 20
    ) -> tuple[list[Journal], Optional[str]]:
        """
        List journals for a specific user with cursor-based pagination.
        
        Args:
            user_id: User ID who owns the journals
            cursor: Opaque cursor from previous page (None for first page)
            page_size: Number of items per page
            
        Returns:
            Tuple of (journals list, next cursor string or None if no more pages)
        """
        page_size = min(page_size, self.config.max_page_size)
        page_size = max(1, page_size)
        
        journals, next_cursor = await self.repository.find_all_by_user(
            user_id, cursor=cursor, limit=page_size
        )
        
        return journals, next_cursor
    
    async def update_journal(
        self,
        journal_id: str,
        user_id: str,
        title: Optional[str] = None,
        content: Optional[str] = None,
        tags: Optional[list[str]] = None,
        created_at: Optional[datetime] = None,
    ) -> Optional[Journal]:
        """
        Update a journal entry for a specific user with business validation.
        
        Args:
            journal_id: Journal ID string
            user_id: User ID who owns the journal
            title: New title (optional)
            content: New content (optional)
            tags: New tags (optional)
            created_at: Override creation date (optional)
            
        Returns:
            Updated journal or None if not found
            
        Raises:
            ValueError: If validation fails or journal_id is invalid
        """
        from app.core.validators import validate_object_id
        
        obj_id = validate_object_id(journal_id, "journal_id")
        
        # Validate if provided
        if title is not None:
            self._validate_title(title)
            title = title.strip()
        
        if content is not None:
            self._validate_content(content)
            content = content.strip()
        
        if tags is not None:
            tags = self._normalize_tags(tags)
        
        rumination_index = compute_rumination_index(content or "") if content is not None else None
        
        return await self.repository.update(
            journal_id=obj_id,
            user_id=user_id,
            title=title,
            content=content,
            tags=tags,
            rumination_index=rumination_index,
            created_at=created_at,
        )
    
    async def delete_journal(self, journal_id: str, user_id: str) -> bool:
        """
        Delete a journal for a specific user.
        
        Args:
            journal_id: Journal ID string
            user_id: User ID who owns the journal
            
        Returns:
            True if deleted, False if not found
            
        Raises:
            ValueError: If journal_id is not a valid ObjectId
        """
        from app.core.validators import validate_object_id
        
        obj_id = validate_object_id(journal_id, "journal_id")
        return await self.repository.delete(obj_id, user_id)
    
    def _validate_title(self, title: str) -> None:
        """Validate journal title."""
        if len(title) > self.config.max_title_length:
            raise ValueError(f"Title cannot exceed {self.config.max_title_length} characters")
    
    def _validate_content(self, content: str) -> None:
        """Validate journal content."""
        if len(content) > self.config.max_content_length:
            raise ValueError(f"Content cannot exceed {self.config.max_content_length} characters")
    
    def _normalize_tags(self, tags: list[str]) -> list[str]:
        """Normalize and deduplicate tags."""
        if not self.config.enable_tags:
            return []
        
        # Strip whitespace, lowercase, remove duplicates, filter empty
        normalized = [tag.strip().lower() for tag in tags]
        normalized = [tag for tag in normalized if tag]
        return list(dict.fromkeys(normalized))  # Preserve order while deduplicating
