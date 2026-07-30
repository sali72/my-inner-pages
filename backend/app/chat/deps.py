from fastapi import Depends

from app.chat.config import ChatModuleConfig
from app.chat.db.repository import ChatRepository
from app.chat.facade import ChatPersistenceFacade
from app.chat.history_manager import ChatHistoryManager


def get_chat_config() -> ChatModuleConfig:
    return ChatModuleConfig()


def get_chat_repository() -> ChatRepository:
    return ChatRepository()


def get_chat_history_manager(
    config: ChatModuleConfig = Depends(get_chat_config),
) -> ChatHistoryManager:
    return ChatHistoryManager(max_messages=config.max_messages_for_context)


def get_chat_facade(
    chat_repository: ChatRepository = Depends(get_chat_repository),
    config: ChatModuleConfig = Depends(get_chat_config),
    history_manager: ChatHistoryManager = Depends(get_chat_history_manager),
) -> ChatPersistenceFacade:
    return ChatPersistenceFacade(
        chat_repository=chat_repository,
        config=config,
        history_manager=history_manager,
    )
