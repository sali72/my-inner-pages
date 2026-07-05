from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Annotated

from app.chat.api.v0.schemas.chat import (
    ChatResponse,
    ChatListResponse,
    UpdateChatTitleRequest,
    MessageResponse,
)
from app.chat.deps import get_chat_persistence_service
from app.chat.service import ChatPersistenceService
from app.core.deps.auth import get_current_user
from app.core.deps.database import get_db
from app.auth.db.models import User

router = APIRouter(prefix="/chats", tags=["chats"])


@router.get(
    "",
    response_model=ChatListResponse,
    summary="List all chats for the user",
    dependencies=[Depends(get_db)],
)
async def list_chats(
    page: Annotated[int, Query(ge=1, description="Page number")] = 1,
    page_size: Annotated[int, Query(ge=1, le=100, description="Items per page")] = 50,
    current_user: User = Depends(get_current_user),
    chat_persistence: ChatPersistenceService = Depends(get_chat_persistence_service),
) -> ChatListResponse:
    chats, total = await chat_persistence.list_chats(
        user_id=str(current_user.id),
        page=page,
        page_size=page_size,
    )
    return ChatListResponse.create(
        chats=chats,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/{chat_id}",
    response_model=ChatResponse,
    summary="Get a specific chat with all messages",
    dependencies=[Depends(get_db)],
)
async def get_chat(
    chat_id: str,
    current_user: User = Depends(get_current_user),
    chat_persistence: ChatPersistenceService = Depends(get_chat_persistence_service),
) -> ChatResponse:
    chat = await chat_persistence.get_chat(chat_id, str(current_user.id))
    if not chat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat not found",
        )
    return ChatResponse.from_document(chat)


@router.delete(
    "/{chat_id}",
    response_model=MessageResponse,
    summary="Delete a chat",
    dependencies=[Depends(get_db)],
)
async def delete_chat(
    chat_id: str,
    current_user: User = Depends(get_current_user),
    chat_persistence: ChatPersistenceService = Depends(get_chat_persistence_service),
) -> MessageResponse:
    deleted = await chat_persistence.delete_chat(chat_id, str(current_user.id))
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat not found",
        )
    return MessageResponse(message="Chat deleted successfully")


@router.patch(
    "/{chat_id}/title",
    response_model=ChatResponse,
    summary="Update chat title",
    dependencies=[Depends(get_db)],
)
async def update_chat_title(
    chat_id: str,
    request: UpdateChatTitleRequest,
    current_user: User = Depends(get_current_user),
    chat_persistence: ChatPersistenceService = Depends(get_chat_persistence_service),
) -> ChatResponse:
    chat = await chat_persistence.update_title(
        chat_id, str(current_user.id), request.title
    )
    if not chat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat not found",
        )
    return ChatResponse.from_document(chat)
