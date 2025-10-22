from datetime import datetime
from typing import Optional
from beanie import PydanticObjectId
from beanie.operators import In, Set

from app.journals.db.models import Journal


class JournalRepository:
    """Repository for journal data access operations."""
    
    def __init__(self):
        self.model = Journal
    
    async def create(self, user_id: str, title: str, content: str, tags: Optional[list[str]] = None) -> Journal:
        """
        Create a new journal entry for a user.
        
        Args:
            user_id: User ID who owns this journal
            title: Journal title
            content: Journal content
            tags: Optional list of tags
            
        Returns:
            Created journal document
        """
        journal = Journal(
            user_id=user_id,
            title=title,
            content=content,
            tags=tags or []
        )
        await journal.insert()
        return journal
    
    async def find_by_id(self, journal_id: PydanticObjectId, user_id: str) -> Optional[Journal]:
        """
        Find a journal by ID for a specific user.
        
        Args:
            journal_id: Journal document ID
            user_id: User ID who owns the journal
            
        Returns:
            Journal document or None if not found
        """
        query = {"_id": journal_id, "user_id": user_id}
        return await self.model.find_one(query)
    
    async def find_all_by_user(
        self,
        user_id: str,
        skip: int = 0,
        limit: int = 20
    ) -> list[Journal]:
        """
        Find all journals for a specific user with pagination.
        
        Args:
            user_id: User ID who owns the journals
            skip: Number of documents to skip
            limit: Maximum number of documents to return
            
        Returns:
            List of journal documents
        """
        query = {"user_id": user_id}
        return await self.model.find(query).sort("-created_at").skip(skip).limit(limit).to_list()
    
    async def count_by_user(self, user_id: str) -> int:
        """
        Count total journals for a specific user.
        
        Args:
            user_id: User ID who owns the journals
            
        Returns:
            Total count of journals for the user
        """
        query = {"user_id": user_id}
        return await self.model.find(query).count()
    
    async def update(
        self,
        journal_id: PydanticObjectId,
        user_id: str,
        title: Optional[str] = None,
        content: Optional[str] = None,
        tags: Optional[list[str]] = None
    ) -> Optional[Journal]:
        """
        Update a journal entry for a specific user.
        
        Args:
            journal_id: Journal document ID
            user_id: User ID who owns the journal
            title: New title (optional)
            content: New content (optional)
            tags: New tags (optional)
            
        Returns:
            Updated journal document or None if not found
        """
        journal = await self.find_by_id(journal_id, user_id)
        if not journal:
            return None
        
        update_data = {"updated_at": datetime.utcnow()}
        
        if title is not None:
            update_data["title"] = title
        if content is not None:
            update_data["content"] = content
        if tags is not None:
            update_data["tags"] = tags
        
        await journal.set(update_data)
        return journal
    
    async def delete(self, journal_id: PydanticObjectId, user_id: str) -> bool:
        """
        Delete a journal for a specific user.
        
        Args:
            journal_id: Journal document ID
            user_id: User ID who owns the journal
            
        Returns:
            True if deleted, False if not found
        """
        journal = await self.find_by_id(journal_id, user_id)
        if not journal:
            return False
        
        await journal.delete()
        return True
