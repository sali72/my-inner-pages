from typing import Optional
from app.memory.db.models import UserModel
from app.core.exceptions import RepositoryException
from app.core.logging import get_logger

logger = get_logger(__name__)


class UserModelRepository:
    def __init__(self):
        self.model = UserModel

    async def find_by_user_id(
        self,
        user_id: str,
    ) -> Optional[UserModel]:
        try:
            return await self.model.find_one({"user_id": user_id})
        except Exception as e:
            logger.error("user_model_find_failed", user_id=user_id, error=str(e))
            raise RepositoryException(
                f"Failed to find user model: {str(e)}",
                details={"user_id": user_id}
            )

    async def upsert(
        self,
        user_model: UserModel,
    ) -> UserModel:
        try:
            existing = await self.find_by_user_id(user_model.user_id)
            if existing:
                user_model.id = existing.id
                user_model.createdAt = existing.createdAt
                await user_model.replace()
                logger.info("user_model_updated", user_id=user_model.user_id)
            else:
                await user_model.insert()
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
    ) -> bool:
        try:
            result = await self.model.find_one({"user_id": user_id})
            if not result:
                return False
            await result.delete()
            logger.info("user_model_deleted", user_id=user_id)
            return True
        except Exception as e:
            logger.error("user_model_delete_failed", user_id=user_id, error=str(e))
            raise RepositoryException(
                f"Failed to delete user model: {str(e)}",
                details={"user_id": user_id}
            )
