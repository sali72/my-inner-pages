from typing import Optional
from beanie import PydanticObjectId

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
        title: str,
        content: str,
        tags: Optional[list[str]] = None
    ) -> Journal:
        """
        Create a new journal entry for a user with business validation.
        
        Args:
            user_id: User ID who owns this journal
            title: Journal title
            content: Journal content
            tags: Optional list of tags
            
        Returns:
            Created journal
            
        Raises:
            ValueError: If validation fails
        """
        # Business validation
        self._validate_title(title)
        self._validate_content(content)
        
        # Normalize tags
        normalized_tags = self._normalize_tags(tags or [])
        
        return await self.repository.create(
            user_id=user_id,
            title=title.strip(),
            content=content.strip(),
            tags=normalized_tags
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
        page: int = 1,
        page_size: int = 20
    ) -> tuple[list[Journal], int]:
        """
        List journals for a specific user with pagination.
        
        Args:
            user_id: User ID who owns the journals
            page: Page number (1-indexed)
            page_size: Number of items per page
            
        Returns:
            Tuple of (journals list, total count)
        """
        # Validate and normalize pagination
        page = max(1, page)
        page_size = min(page_size, self.config.max_page_size)
        page_size = max(1, page_size)
        
        skip = (page - 1) * page_size
        
        journals = await self.repository.find_all_by_user(user_id, skip=skip, limit=page_size)
        total = await self.repository.count_by_user(user_id)
        
        return journals, total
    
    async def update_journal(
        self,
        journal_id: str,
        user_id: str,
        title: Optional[str] = None,
        content: Optional[str] = None,
        tags: Optional[list[str]] = None
    ) -> Optional[Journal]:
        """
        Update a journal entry for a specific user with business validation.
        
        Args:
            journal_id: Journal ID string
            user_id: User ID who owns the journal
            title: New title (optional)
            content: New content (optional)
            tags: New tags (optional)
            
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
        
        return await self.repository.update(
            journal_id=obj_id,
            user_id=user_id,
            title=title,
            content=content,
            tags=tags
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
        if not title or not title.strip():
            raise ValueError("Title cannot be empty")
        
        if len(title) > self.config.max_title_length:
            raise ValueError(f"Title cannot exceed {self.config.max_title_length} characters")
    
    def _validate_content(self, content: str) -> None:
        """Validate journal content."""
        if not content or not content.strip():
            raise ValueError("Content cannot be empty")
        
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
