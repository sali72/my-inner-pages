from typing import Optional
from beanie import PydanticObjectId

from app.chat.config import ChatModuleConfig
from app.chat.db.models import Chat
from app.chat.db.repository import ChatRepository
from app.chat.history_manager import ChatHistoryManager
from app.core.exceptions import RepositoryException, DocumentNotFoundException
from app.core.logging import get_logger

logger = get_logger(__name__)


class ChatPersistenceService:
    def __init__(
        self,
        chat_repository: ChatRepository,
        config: ChatModuleConfig,
    ) -> None:
        self.repository = chat_repository
        self.config = config
        self.history_manager = ChatHistoryManager(
            max_messages=config.max_messages_for_context
        )

    def _generate_title(self, content: str) -> str:
        max_len = self.config.max_title_length
        cleaned = content.strip().replace("\n", " ")
        if len(cleaned) > max_len:
            title = cleaned[:max_len - 3].rstrip() + "..."
        else:
            title = cleaned[:max_len]
        return title if title else "New chat"

    async def create_chat(
        self,
        user_id: str,
        linked_entry_id: Optional[str] = None,
    ) -> Chat:
        return await self.repository.create(
            user_id=user_id,
            linked_entry_id=linked_entry_id,
        )

    async def get_or_create_chat(
        self,
        user_id: str,
        chat_id: Optional[str] = None,
        linked_entry_id: Optional[str] = None,
    ) -> tuple[Chat, list[dict]]:
        if chat_id:
            try:
                obj_id = PydanticObjectId(chat_id)
                chat = await self.repository.find_by_id(obj_id, user_id)
                if chat:
                    history = self.history_manager.prepare_for_context(chat.messages)
                    logger.info(
                        "chat_loaded",
                        chat_id=chat_id,
                        message_count=len(chat.messages),
                    )
                    return chat, history
            except Exception:
                logger.warning("chat_id_invalid_or_not_found", chat_id=chat_id)

        chat = await self.create_chat(user_id, linked_entry_id)
        logger.info("chat_created_fresh", chat_id=str(chat.id), user_id=user_id)
        return chat, []

    async def append_message(
        self,
        chat_id: str,
        user_id: str,
        role: str,
        content: str,
    ) -> Chat:
        obj_id = PydanticObjectId(chat_id)
        chat = await self.repository.append_message(obj_id, user_id, role, content)
        if not chat:
            raise DocumentNotFoundException("Chat", chat_id)

        if role == "user" and len(chat.messages) == 1:
            title = self._generate_title(content)
            await self.repository.update_title(obj_id, user_id, title)

        return chat

    async def get_chat(
        self,
        chat_id: str,
        user_id: str,
    ) -> Optional[Chat]:
        obj_id = PydanticObjectId(chat_id)
        return await self.repository.find_by_id(obj_id, user_id)

    async def get_history_for_context(
        self,
        chat_id: str,
        user_id: str,
    ) -> list[dict]:
        chat = await self.get_chat(chat_id, user_id)
        if not chat:
            return []
        return self.history_manager.prepare_for_context(chat.messages)

    async def list_chats(
        self,
        user_id: str,
        page: int = 1,
        page_size: int = 50,
    ) -> tuple[list[Chat], int]:
        skip = (page - 1) * page_size
        chats = await self.repository.find_all_by_user(
            user_id=user_id, skip=skip, limit=page_size
        )
        total = await self.repository.count_by_user(user_id)
        return chats, total

    async def truncate_messages(
        self,
        chat_id: str,
        user_id: str,
        keep_count: int,
    ) -> Chat:
        obj_id = PydanticObjectId(chat_id)
        chat = await self.repository.truncate_messages(obj_id, user_id, keep_count)
        if not chat:
            raise DocumentNotFoundException("Chat", chat_id)
        return chat

    async def update_title(
        self,
        chat_id: str,
        user_id: str,
        title: str,
    ) -> Optional[Chat]:
        obj_id = PydanticObjectId(chat_id)
        truncated = title[:self.config.max_title_length]
        return await self.repository.update_title(obj_id, user_id, truncated)

    async def delete_chat(
        self,
        chat_id: str,
        user_id: str,
    ) -> bool:
        obj_id = PydanticObjectId(chat_id)
        return await self.repository.delete(obj_id, user_id)
