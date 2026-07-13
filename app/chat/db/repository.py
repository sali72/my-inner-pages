from datetime import datetime
from typing import Optional
from beanie import PydanticObjectId
from pymongo.errors import PyMongoError

from app.chat.db.models import Chat, ChatMessage
from app.core.exceptions import RepositoryException, DocumentNotFoundException
from app.core.logging import get_logger

logger = get_logger(__name__)


class ChatRepository:
    def __init__(self):
        self.model = Chat

    async def create(
        self,
        user_id: str,
        title: str = "",
        linked_entry_id: Optional[str] = None,
    ) -> Chat:
        try:
            chat = Chat(
                user_id=user_id,
                title=title,
                linked_entry_id=linked_entry_id,
            )
            await chat.insert()
            logger.info("chat_created", chat_id=str(chat.id), user_id=user_id)
            return chat
        except PyMongoError as e:
            logger.error("chat_create_failed", error=str(e), user_id=user_id)
            raise RepositoryException(
                f"Failed to create chat: {str(e)}",
                details={"user_id": user_id, "error": str(e)},
            )

    async def find_by_id(
        self,
        chat_id: PydanticObjectId,
        user_id: str,
    ) -> Optional[Chat]:
        try:
            return await self.model.find_one(
                {"_id": chat_id, "user_id": user_id}
            )
        except PyMongoError as e:
            logger.error("chat_find_failed", error=str(e), chat_id=str(chat_id))
            raise RepositoryException(
                f"Failed to find chat: {str(e)}",
                details={"chat_id": str(chat_id), "error": str(e)},
            )

    async def find_all_by_user(
        self,
        user_id: str,
        skip: int = 0,
        limit: int = 50,
    ) -> list[Chat]:
        try:
            return await self.model.find(
                {"user_id": user_id}
            ).sort("-updated_at").skip(skip).limit(limit).to_list()
        except PyMongoError as e:
            logger.error("chat_list_failed", error=str(e), user_id=user_id)
            raise RepositoryException(
                f"Failed to list chats: {str(e)}",
                details={"user_id": user_id, "error": str(e)},
            )

    async def count_by_user(
        self,
        user_id: str,
    ) -> int:
        try:
            return await self.model.find(
                {"user_id": user_id}
            ).count()
        except PyMongoError as e:
            logger.error("chat_count_failed", error=str(e), user_id=user_id)
            raise RepositoryException(
                f"Failed to count chats: {str(e)}",
                details={"user_id": user_id, "error": str(e)},
            )

    async def append_message(
        self,
        chat_id: PydanticObjectId,
        user_id: str,
        role: str,
        content: str,
    ) -> Optional[Chat]:
        try:
            message = ChatMessage(role=role, content=content)
            chat = await self.model.find_one(
                {"_id": chat_id, "user_id": user_id}
            )
            if not chat:
                return None

            await chat.update(
                {"$push": {"messages": message.model_dump()}, "$set": {"updated_at": datetime.utcnow()}}
            )
            logger.info(
                "chat_message_appended",
                chat_id=str(chat_id),
                role=role,
                content_length=len(content),
            )
            return chat
        except PyMongoError as e:
            logger.error(
                "chat_append_failed",
                error=str(e),
                chat_id=str(chat_id),
            )
            raise RepositoryException(
                f"Failed to append message: {str(e)}",
                details={"chat_id": str(chat_id), "error": str(e)},
            )

    async def truncate_messages(
        self,
        chat_id: PydanticObjectId,
        user_id: str,
        keep_count: int,
    ) -> Optional[Chat]:
        try:
            chat = await self.model.find_one(
                {"_id": chat_id, "user_id": user_id}
            )
            if not chat:
                return None

            await chat.update(
                {"$set": {
                    "messages": {"$slice": keep_count},
                    "updated_at": datetime.utcnow(),
                }}
            )
            logger.info(
                "chat_messages_truncated",
                chat_id=str(chat_id),
                kept=keep_count,
            )
            return chat
        except PyMongoError as e:
            logger.error(
                "chat_truncate_failed",
                error=str(e),
                chat_id=str(chat_id),
            )
            raise RepositoryException(
                f"Failed to truncate chat messages: {str(e)}",
                details={"chat_id": str(chat_id), "error": str(e)},
            )

    async def update_title(
        self,
        chat_id: PydanticObjectId,
        user_id: str,
        title: str,
    ) -> Optional[Chat]:
        try:
            chat = await self.find_by_id(chat_id, user_id)
            if not chat:
                return None

            await chat.set(
                {"title": title, "updated_at": datetime.utcnow()}
            )
            logger.info("chat_title_updated", chat_id=str(chat_id))
            return chat
        except PyMongoError as e:
            logger.error(
                "chat_title_update_failed", error=str(e), chat_id=str(chat_id)
            )
            raise RepositoryException(
                f"Failed to update chat title: {str(e)}",
                details={"chat_id": str(chat_id), "error": str(e)},
            )

    async def delete(
        self,
        chat_id: PydanticObjectId,
        user_id: str,
    ) -> bool:
        try:
            chat = await self.find_by_id(chat_id, user_id)
            if not chat:
                return False

            await chat.delete()
            logger.info("chat_deleted", chat_id=str(chat_id), user_id=user_id)
            return True
        except PyMongoError as e:
            logger.error(
                "chat_delete_failed", error=str(e), chat_id=str(chat_id)
            )
            raise RepositoryException(
                f"Failed to delete chat: {str(e)}",
                details={"chat_id": str(chat_id), "error": str(e)},
            )
