from fastapi import Depends

from app.chat.config import ChatModuleConfig
from app.chat.db.repository import ChatRepository
from app.chat.service import ChatPersistenceService


def get_chat_config() -> ChatModuleConfig:
    return ChatModuleConfig()


def get_chat_repository() -> ChatRepository:
    return ChatRepository()


def get_chat_persistence_service(
    chat_repository: ChatRepository = Depends(get_chat_repository),
    config: ChatModuleConfig = Depends(get_chat_config),
) -> ChatPersistenceService:
    return ChatPersistenceService(
        chat_repository=chat_repository,
        config=config,
    )
