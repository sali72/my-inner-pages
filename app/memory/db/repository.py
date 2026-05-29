from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClientSession
from app.memory.db.models import UserModel
from app.core.exceptions import RepositoryException
from app.core.deps.database import get_current_session
from app.core.logging import get_logger

logger = get_logger(__name__)


class UserModelRepository:
    def __init__(self):
        self.model = UserModel

    async def find_by_user_id(
        self,
        user_id: str,
        session: Optional[AsyncIOMotorClientSession] = None
    ) -> Optional[UserModel]:
        try:
            if session is None:
                session = get_current_session()
            return await self.model.find_one({"user_id": user_id}, session=session)
        except Exception as e:
            logger.error("user_model_find_failed", user_id=user_id, error=str(e))
            raise RepositoryException(
                f"Failed to find user model: {str(e)}",
                details={"user_id": user_id}
            )

    async def upsert(
        self,
        user_model: UserModel,
        session: Optional[AsyncIOMotorClientSession] = None
    ) -> UserModel:
        try:
            if session is None:
                session = get_current_session()
            existing = await self.find_by_user_id(user_model.user_id, session=session)
            if existing:
                user_model.id = existing.id
                user_model.createdAt = existing.createdAt
                await user_model.replace(session=session)
                logger.info("user_model_updated", user_id=user_model.user_id)
            else:
                await user_model.insert(session=session)
                logger.info("user_model_created", user_id=user_model.user_id)
            return user_model
        except Exception as e:
            logger.error("user_model_upsert_failed", user_id=user_model.user_id, error=str(e))
            raise RepositoryException(
                f"Failed to upsert user model: {str(e)}",
                details={"user_id": user_model.user_id}
            )

    async def delete_by_user_id(
        self,
        user_id: str,
        session: Optional[AsyncIOMotorClientSession] = None
    ) -> bool:
        try:
            if session is None:
                session = get_current_session()
            result = await self.model.find_one({"user_id": user_id}, session=session)
            if not result:
                return False
            await result.delete(session=session)
            logger.info("user_model_deleted", user_id=user_id)
            return True
        except Exception as e:
            logger.error("user_model_delete_failed", user_id=user_id, error=str(e))
            raise RepositoryException(
                f"Failed to delete user model: {str(e)}",
                details={"user_id": user_id}
            )
