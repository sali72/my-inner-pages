from datetime import datetime
from typing import Optional
from beanie import PydanticObjectId
from pymongo.errors import PyMongoError, DuplicateKeyError
from motor.motor_asyncio import AsyncIOMotorClientSession

from app.auth.db.models import User
from app.core.exceptions import RepositoryException, DuplicateDocumentException
from app.core.logging import get_logger

logger = get_logger(__name__)


class UserRepository:
    """Repository for user data access operations."""
    
    def __init__(self):
        self.model = User
    
    async def create(
        self,
        email: str,
        hashed_password: str,
        session: Optional[AsyncIOMotorClientSession] = None
    ) -> User:
        """
        Create a new user.
        
        Args:
            email: User email address
            hashed_password: Hashed password
            session: Optional MongoDB session for transactions
            
        Returns:
            Created user document
            
        Raises:
            DuplicateDocumentException: If email already exists
            RepositoryException: If database operation fails
        """
        try:
            user = User(
                email=email.lower(),
                hashed_password=hashed_password
            )
            await user.insert(session=session)
            logger.info("user_created", user_id=str(user.id), email=email)
            return user
        except DuplicateKeyError:
            logger.warning("user_duplicate_email", email=email)
            raise DuplicateDocumentException("User", "email", email)
        except PyMongoError as e:
            logger.error("user_create_failed", error=str(e), email=email)
            raise RepositoryException(
                f"Failed to create user: {str(e)}",
                details={"email": email, "error": str(e)}
            )
    
    async def find_by_email(
        self,
        email: str,
        session: Optional[AsyncIOMotorClientSession] = None
    ) -> Optional[User]:
        """
        Find a user by email.
        
        Args:
            email: User email address
            session: Optional MongoDB session for transactions
            
        Returns:
            User document or None if not found
            
        Raises:
            RepositoryException: If database operation fails
        """
        try:
            return await self.model.find_one({"email": email.lower()}, session=session)
        except PyMongoError as e:
            logger.error("user_find_by_email_failed", error=str(e), email=email)
            raise RepositoryException(
                f"Failed to find user by email: {str(e)}",
                details={"email": email, "error": str(e)}
            )
    
    async def find_by_id(
        self,
        user_id: PydanticObjectId,
        session: Optional[AsyncIOMotorClientSession] = None
    ) -> Optional[User]:
        """
        Find a user by ID.
        
        Args:
            user_id: User document ID
            session: Optional MongoDB session for transactions
            
        Returns:
            User document or None if not found
            
        Raises:
            RepositoryException: If database operation fails
        """
        try:
            return await self.model.find_one({"_id": user_id}, session=session)
        except PyMongoError as e:
            logger.error("user_find_by_id_failed", error=str(e), user_id=str(user_id))
            raise RepositoryException(
                f"Failed to find user by ID: {str(e)}",
                details={"user_id": str(user_id), "error": str(e)}
            )
    
    async def update_password(
        self,
        user_id: PydanticObjectId,
        hashed_password: str,
        session: Optional[AsyncIOMotorClientSession] = None
    ) -> Optional[User]:
        """
        Update user password.
        
        Args:
            user_id: User document ID
            hashed_password: New hashed password
            session: Optional MongoDB session for transactions
            
        Returns:
            Updated user or None if not found
            
        Raises:
            RepositoryException: If database operation fails
        """
        try:
            user = await self.find_by_id(user_id, session=session)
            if not user:
                return None
            
            await user.set({
                "hashed_password": hashed_password,
                "updated_at": datetime.utcnow()
            }, session=session)
            logger.info("user_password_updated", user_id=str(user_id))
            return user
        except PyMongoError as e:
            logger.error("user_password_update_failed", error=str(e), user_id=str(user_id))
            raise RepositoryException(
                f"Failed to update password: {str(e)}",
                details={"user_id": str(user_id), "error": str(e)}
            )
    
    async def update_last_login(
        self,
        user_id: PydanticObjectId,
        session: Optional[AsyncIOMotorClientSession] = None
    ) -> bool:
        """
        Update user's last login timestamp.
        
        Args:
            user_id: User document ID
            session: Optional MongoDB session for transactions
            
        Returns:
            True if updated, False if not found
            
        Raises:
            RepositoryException: If database operation fails
        """
        try:
            user = await self.find_by_id(user_id, session=session)
            if not user:
                return False
            
            user.update_last_login()
            await user.save(session=session)
            logger.debug("user_last_login_updated", user_id=str(user_id))
            return True
        except PyMongoError as e:
            logger.error("user_last_login_update_failed", error=str(e), user_id=str(user_id))
            raise RepositoryException(
                f"Failed to update last login: {str(e)}",
                details={"user_id": str(user_id), "error": str(e)}
            )
    
    async def email_exists(
        self,
        email: str,
        session: Optional[AsyncIOMotorClientSession] = None
    ) -> bool:
        """
        Check if email already exists.
        
        Args:
            email: Email to check
            session: Optional MongoDB session for transactions
            
        Returns:
            True if exists, False otherwise
            
        Raises:
            RepositoryException: If database operation fails
        """
        user = await self.find_by_email(email, session=session)
        return user is not None
