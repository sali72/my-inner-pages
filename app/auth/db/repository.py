from datetime import datetime
from typing import Optional
from beanie import PydanticObjectId

from app.auth.db.models import User


class UserRepository:
    """Repository for user data access operations."""
    
    def __init__(self):
        self.model = User
    
    async def create(self, email: str, hashed_password: str) -> User:
        """
        Create a new user.
        
        Args:
            email: User email address
            hashed_password: Hashed password
            
        Returns:
            Created user document
        """
        user = User(
            email=email.lower(),
            hashed_password=hashed_password
        )
        await user.insert()
        return user
    
    async def find_by_email(self, email: str) -> Optional[User]:
        """
        Find a user by email.
        
        Args:
            email: User email address
            
        Returns:
            User document or None if not found
        """
        return await self.model.find_one({"email": email.lower()})
    
    async def find_by_id(self, user_id: PydanticObjectId) -> Optional[User]:
        """
        Find a user by ID.
        
        Args:
            user_id: User document ID
            
        Returns:
            User document or None if not found
        """
        return await self.model.find_one({"_id": user_id})
    
    async def update_password(self, user_id: PydanticObjectId, hashed_password: str) -> Optional[User]:
        """
        Update user password.
        
        Args:
            user_id: User document ID
            hashed_password: New hashed password
            
        Returns:
            Updated user or None if not found
        """
        user = await self.find_by_id(user_id)
        if not user:
            return None
        
        await user.set({
            "hashed_password": hashed_password,
            "updated_at": datetime.utcnow()
        })
        return user
    
    async def update_last_login(self, user_id: PydanticObjectId) -> bool:
        """
        Update user's last login timestamp.
        
        Args:
            user_id: User document ID
            
        Returns:
            True if updated, False if not found
        """
        user = await self.find_by_id(user_id)
        if not user:
            return False
        
        user.update_last_login()
        await user.save()
        return True
    
    async def email_exists(self, email: str) -> bool:
        """
        Check if email already exists.
        
        Args:
            email: Email to check
            
        Returns:
            True if exists, False otherwise
        """
        user = await self.find_by_email(email)
        return user is not None
