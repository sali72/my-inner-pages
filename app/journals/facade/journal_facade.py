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
    
    def __init__(self, repository: Optional[JournalRepository] = None):
        self.repository = repository or JournalRepository()
        self.config = JournalModuleConfig()
    
    async def create_journal(
        self,
        title: str,
        content: str,
        tags: Optional[list[str]] = None
    ) -> Journal:
        """
        Create a new journal entry with business validation.
        
        Args:
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
            title=title.strip(),
            content=content.strip(),
            tags=normalized_tags
        )
    
    async def get_journal(self, journal_id: str) -> Optional[Journal]:
        """
        Get a journal by ID.
        
        Args:
            journal_id: Journal ID string
            
        Returns:
            Journal or None if not found
        """
        try:
            obj_id = PydanticObjectId(journal_id)
        except Exception:
            return None
        
        return await self.repository.find_by_id(obj_id)
    
    async def list_journals(
        self,
        page: int = 1,
        page_size: int = 20
    ) -> tuple[list[Journal], int]:
        """
        List journals with pagination.
        
        Args:
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
        
        journals = await self.repository.find_all(skip=skip, limit=page_size)
        total = await self.repository.count()
        
        return journals, total
    
    async def update_journal(
        self,
        journal_id: str,
        title: Optional[str] = None,
        content: Optional[str] = None,
        tags: Optional[list[str]] = None
    ) -> Optional[Journal]:
        """
        Update a journal entry with business validation.
        
        Args:
            journal_id: Journal ID string
            title: New title (optional)
            content: New content (optional)
            tags: New tags (optional)
            
        Returns:
            Updated journal or None if not found
            
        Raises:
            ValueError: If validation fails
        """
        try:
            obj_id = PydanticObjectId(journal_id)
        except Exception:
            return None
        
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
            title=title,
            content=content,
            tags=tags
        )
    
    async def delete_journal(self, journal_id: str) -> bool:
        """
        Delete a journal (soft delete by default).
        
        Args:
            journal_id: Journal ID string
            
        Returns:
            True if deleted, False if not found
        """
        try:
            obj_id = PydanticObjectId(journal_id)
        except Exception:
            return False
        
        if self.config.enable_soft_delete:
            return await self.repository.soft_delete(obj_id)
        else:
            return await self.repository.hard_delete(obj_id)
    
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
