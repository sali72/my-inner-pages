from datetime import datetime
from typing import Optional
from beanie import PydanticObjectId
from beanie.operators import In, Set

from app.journals.db.models import Journal


class JournalRepository:
    """Repository for journal data access operations."""
    
    def __init__(self):
        self.model = Journal
    
    async def create(self, title: str, content: str, tags: Optional[list[str]] = None) -> Journal:
        """
        Create a new journal entry.
        
        Args:
            title: Journal title
            content: Journal content
            tags: Optional list of tags
            
        Returns:
            Created journal document
        """
        journal = Journal(
            title=title,
            content=content,
            tags=tags or []
        )
        await journal.insert()
        return journal
    
    async def find_by_id(self, journal_id: PydanticObjectId, include_deleted: bool = False) -> Optional[Journal]:
        """
        Find a journal by ID.
        
        Args:
            journal_id: Journal document ID
            include_deleted: Whether to include soft-deleted journals
            
        Returns:
            Journal document or None if not found
        """
        query = {"_id": journal_id}
        if not include_deleted:
            query["is_deleted"] = False
        
        return await self.model.find_one(query)
    
    async def find_all(
        self,
        skip: int = 0,
        limit: int = 20,
        include_deleted: bool = False
    ) -> list[Journal]:
        """
        Find all journals with pagination.
        
        Args:
            skip: Number of documents to skip
            limit: Maximum number of documents to return
            include_deleted: Whether to include soft-deleted journals
            
        Returns:
            List of journal documents
        """
        query = self.model.find()
        
        if not include_deleted:
            query = query.find({"is_deleted": False})
        
        return await query.sort("-created_at").skip(skip).limit(limit).to_list()
    
    async def count(self, include_deleted: bool = False) -> int:
        """
        Count total journals.
        
        Args:
            include_deleted: Whether to include soft-deleted journals
            
        Returns:
            Total count of journals
        """
        query = {}
        if not include_deleted:
            query["is_deleted"] = False
        
        return await self.model.find(query).count()
    
    async def update(
        self,
        journal_id: PydanticObjectId,
        title: Optional[str] = None,
        content: Optional[str] = None,
        tags: Optional[list[str]] = None
    ) -> Optional[Journal]:
        """
        Update a journal entry.
        
        Args:
            journal_id: Journal document ID
            title: New title (optional)
            content: New content (optional)
            tags: New tags (optional)
            
        Returns:
            Updated journal document or None if not found
        """
        journal = await self.find_by_id(journal_id)
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
    
    async def soft_delete(self, journal_id: PydanticObjectId) -> bool:
        """
        Soft delete a journal (mark as deleted).
        
        Args:
            journal_id: Journal document ID
            
        Returns:
            True if deleted, False if not found
        """
        journal = await self.find_by_id(journal_id)
        if not journal:
            return False
        
        journal.soft_delete()
        await journal.save()
        return True
    
    async def hard_delete(self, journal_id: PydanticObjectId) -> bool:
        """
        Permanently delete a journal from database.
        
        Args:
            journal_id: Journal document ID
            
        Returns:
            True if deleted, False if not found
        """
        journal = await self.find_by_id(journal_id, include_deleted=True)
        if not journal:
            return False
        
        await journal.delete()
        return True
    
    async def restore(self, journal_id: PydanticObjectId) -> Optional[Journal]:
        """
        Restore a soft-deleted journal.
        
        Args:
            journal_id: Journal document ID
            
        Returns:
            Restored journal or None if not found
        """
        journal = await self.find_by_id(journal_id, include_deleted=True)
        if not journal or not journal.is_deleted:
            return None
        
        journal.restore()
        await journal.save()
        return journal
