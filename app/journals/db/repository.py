from datetime import datetime
from typing import Optional
from beanie import PydanticObjectId
from beanie.operators import In, Set
from pymongo.errors import PyMongoError, DuplicateKeyError
from motor.motor_asyncio import AsyncIOMotorClientSession

from app.journals.db.models import Journal
from app.core.exceptions import RepositoryException, DocumentNotFoundException
from app.core.logging import get_logger

logger = get_logger(__name__)


class JournalRepository:
    """Repository for journal data access operations."""
    
    def __init__(self):
        self.model = Journal
    
    async def create(
        self,
        user_id: str,
        title: str,
        content: str,
        tags: Optional[list[str]] = None,
        session: Optional[AsyncIOMotorClientSession] = None
    ) -> Journal:
        """
        Create a new journal entry for a user.
        
        Args:
            user_id: User ID who owns this journal
            title: Journal title
            content: Journal content
            tags: Optional list of tags
            session: Optional MongoDB session for transactions
            
        Returns:
            Created journal document
            
        Raises:
            RepositoryException: If database operation fails
        """
        try:
            journal = Journal(
                user_id=user_id,
                title=title,
                content=content,
                tags=tags or []
            )
            await journal.insert(session=session)
            logger.info("journal_created", journal_id=str(journal.id), user_id=user_id)
            return journal
        except PyMongoError as e:
            logger.error("journal_create_failed", error=str(e), user_id=user_id)
            raise RepositoryException(
                f"Failed to create journal: {str(e)}",
                details={"user_id": user_id, "error": str(e)}
            )
    
    async def find_by_id(
        self,
        journal_id: PydanticObjectId,
        user_id: str,
        session: Optional[AsyncIOMotorClientSession] = None
    ) -> Optional[Journal]:
        """
        Find a journal by ID for a specific user.
        
        Args:
            journal_id: Journal document ID
            user_id: User ID who owns the journal
            session: Optional MongoDB session for transactions
            
        Returns:
            Journal document or None if not found
            
        Raises:
            RepositoryException: If database operation fails
        """
        try:
            query = {"_id": journal_id, "user_id": user_id}
            return await self.model.find_one(query, session=session)
        except PyMongoError as e:
            logger.error("journal_find_failed", error=str(e), journal_id=str(journal_id))
            raise RepositoryException(
                f"Failed to find journal: {str(e)}",
                details={"journal_id": str(journal_id), "error": str(e)}
            )
    
    async def find_all_by_user(
        self,
        user_id: str,
        skip: int = 0,
        limit: int = 20,
        session: Optional[AsyncIOMotorClientSession] = None
    ) -> list[Journal]:
        """
        Find all journals for a specific user with pagination.
        
        Args:
            user_id: User ID who owns the journals
            skip: Number of documents to skip
            limit: Maximum number of documents to return
            session: Optional MongoDB session for transactions
            
        Returns:
            List of journal documents
            
        Raises:
            RepositoryException: If database operation fails
        """
        try:
            query = {"user_id": user_id}
            return await self.model.find(query, session=session).sort("-created_at").skip(skip).limit(limit).to_list()
        except PyMongoError as e:
            logger.error("journal_list_failed", error=str(e), user_id=user_id)
            raise RepositoryException(
                f"Failed to list journals: {str(e)}",
                details={"user_id": user_id, "error": str(e)}
            )
    
    async def count_by_user(
        self,
        user_id: str,
        session: Optional[AsyncIOMotorClientSession] = None
    ) -> int:
        """
        Count total journals for a specific user.
        
        Args:
            user_id: User ID who owns the journals
            session: Optional MongoDB session for transactions
            
        Returns:
            Total count of journals for the user
            
        Raises:
            RepositoryException: If database operation fails
        """
        try:
            query = {"user_id": user_id}
            return await self.model.find(query, session=session).count()
        except PyMongoError as e:
            logger.error("journal_count_failed", error=str(e), user_id=user_id)
            raise RepositoryException(
                f"Failed to count journals: {str(e)}",
                details={"user_id": user_id, "error": str(e)}
            )
    
    async def update(
        self,
        journal_id: PydanticObjectId,
        user_id: str,
        title: Optional[str] = None,
        content: Optional[str] = None,
        tags: Optional[list[str]] = None,
        session: Optional[AsyncIOMotorClientSession] = None
    ) -> Optional[Journal]:
        """
        Update a journal entry for a specific user.
        
        Args:
            journal_id: Journal document ID
            user_id: User ID who owns the journal
            title: New title (optional)
            content: New content (optional)
            tags: New tags (optional)
            session: Optional MongoDB session for transactions
            
        Returns:
            Updated journal document or None if not found
            
        Raises:
            RepositoryException: If database operation fails
        """
        try:
            journal = await self.find_by_id(journal_id, user_id, session=session)
            if not journal:
                return None
            
            update_data = {"updated_at": datetime.utcnow()}
            
            if title is not None:
                update_data["title"] = title
            if content is not None:
                update_data["content"] = content
            if tags is not None:
                update_data["tags"] = tags
            
            await journal.set(update_data, session=session)
            logger.info("journal_updated", journal_id=str(journal_id), user_id=user_id)
            return journal
        except PyMongoError as e:
            logger.error("journal_update_failed", error=str(e), journal_id=str(journal_id))
            raise RepositoryException(
                f"Failed to update journal: {str(e)}",
                details={"journal_id": str(journal_id), "error": str(e)}
            )
    
    async def delete(
        self,
        journal_id: PydanticObjectId,
        user_id: str,
        session: Optional[AsyncIOMotorClientSession] = None
    ) -> bool:
        """
        Delete a journal for a specific user.
        
        Args:
            journal_id: Journal document ID
            user_id: User ID who owns the journal
            session: Optional MongoDB session for transactions
            
        Returns:
            True if deleted, False if not found
            
        Raises:
            RepositoryException: If database operation fails
        """
        try:
            journal = await self.find_by_id(journal_id, user_id, session=session)
            if not journal:
                return False
            
            await journal.delete(session=session)
            logger.info("journal_deleted", journal_id=str(journal_id), user_id=user_id)
            return True
        except PyMongoError as e:
            logger.error("journal_delete_failed", error=str(e), journal_id=str(journal_id))
            raise RepositoryException(
                f"Failed to delete journal: {str(e)}",
                details={"journal_id": str(journal_id), "error": str(e)}
            )
