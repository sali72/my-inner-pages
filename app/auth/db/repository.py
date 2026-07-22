import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
from beanie import PydanticObjectId
from pymongo.errors import PyMongoError, DuplicateKeyError

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
    ) -> User:
        try:
            user = User(
                email=email.lower(),
                hashed_password=hashed_password
            )
            await user.insert()
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
    ) -> Optional[User]:
        try:
            return await self.model.find_one({"email": email.lower()})
        except PyMongoError as e:
            logger.error("user_find_by_email_failed", error=str(e), email=email)
            raise RepositoryException(
                f"Failed to find user by email: {str(e)}",
                details={"email": email, "error": str(e)}
            )

    async def find_by_id(
        self,
        user_id: PydanticObjectId,
    ) -> Optional[User]:
        try:
            return await self.model.find_one({"_id": user_id})
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
    ) -> Optional[User]:
        try:
            user = await self.find_by_id(user_id)
            if not user:
                return None

            await user.set({
                "hashed_password": hashed_password,
                "updated_at": datetime.now(timezone.utc)
            })
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
    ) -> bool:
        try:
            user = await self.find_by_id(user_id)
            if not user:
                return False

            user.update_last_login()
            await user.save()
            logger.debug("user_last_login_updated", user_id=str(user_id))
            return True
        except PyMongoError as e:
            logger.error("user_last_login_update_failed", error=str(e), user_id=str(user_id))
            raise RepositoryException(
                f"Failed to update last login: {str(e)}",
                details={"user_id": str(user_id), "error": str(e)}
            )

    async def update_preferences(
        self,
        user_id: PydanticObjectId,
        preferences: dict,
    ) -> Optional[User]:
        try:
            user = await self.find_by_id(user_id)
            if not user:
                return None

            await user.set({"preferences": preferences, "updated_at": datetime.now(timezone.utc)})
            logger.info("user_preferences_updated", user_id=str(user_id))
            return user
        except PyMongoError as e:
            logger.error("user_preferences_update_failed", error=str(e), user_id=str(user_id))
            raise RepositoryException(
                f"Failed to update preferences: {str(e)}",
                details={"user_id": str(user_id), "error": str(e)}
            )

    async def email_exists(
        self,
        email: str,
    ) -> bool:
        user = await self.find_by_email(email)
        return user is not None

    async def store_verification_token(
        self,
        user_id: PydanticObjectId,
        expires_in_hours: int = 24,
    ) -> tuple[str, User]:
        user = await self.find_by_id(user_id)
        if not user:
            raise ValueError("User not found")

        token = secrets.token_urlsafe(32)
        await user.set({
            "verification_token": token,
            "verification_token_expires_at": datetime.now(timezone.utc) + timedelta(hours=expires_in_hours),
            "updated_at": datetime.now(timezone.utc),
        })
        return token, user

    async def find_by_verification_token(
        self,
        token: str,
    ) -> Optional[User]:
        try:
            return await self.model.find_one({"verification_token": token})
        except PyMongoError as e:
            logger.error("user_find_by_token_failed", error=str(e))
            raise RepositoryException(
                f"Failed to find user by verification token: {str(e)}",
                details={"error": str(e)}
            )

    async def clear_verification_token(
        self,
        user_id: PydanticObjectId,
    ) -> Optional[User]:
        user = await self.find_by_id(user_id)
        if not user:
            return None

        await user.set({
            "verification_token": None,
            "verification_token_expires_at": None,
            "is_verified": True,
            "updated_at": datetime.now(timezone.utc),
        })
        return user
