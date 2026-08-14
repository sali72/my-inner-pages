from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class ChatMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    role: str = Field(..., description="user or assistant")
    content: str = Field(..., description="Message content")
    created_at: datetime = Field(..., description="Message timestamp")


class ChatResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "title": "Discussion about work stress",
                "messages": [
                    {"role": "user", "content": "I've been feeling stressed", "created_at": "2024-01-15T10:30:00Z"},
                    {"role": "assistant", "content": "Tell me more...", "created_at": "2024-01-15T10:30:05Z"},
                ],
                "message_count": 2,
                "linked_entry_id": None,
                "created_at": "2024-01-15T10:30:00Z",
                "updated_at": "2024-01-15T10:30:05Z",
            }
        },
    )

    id: str = Field(..., description="Chat ID")
    title: str = Field(..., description="Chat title")
    messages: list[ChatMessageResponse] = Field(
        default_factory=list, description="Chat messages"
    )
    message_count: int = Field(..., description="Number of messages")
    linked_entry_id: Optional[str] = Field(
        default=None, description="Linked journal entry ID"
    )
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    @classmethod
    def from_document(cls, chat) -> "ChatResponse":
        return cls(
            id=str(chat.id),
            title=chat.title,
            messages=[
                ChatMessageResponse(
                    role=m.role,
                    content=m.content,
                    created_at=m.created_at,
                )
                for m in chat.messages
            ],
            message_count=len(chat.messages),
            linked_entry_id=chat.linked_entry_id,
            created_at=chat.created_at,
            updated_at=chat.updated_at,
        )


class ChatSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str = Field(..., description="Chat ID")
    title: str = Field(..., description="Chat title")
    message_count: int = Field(..., description="Number of messages")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    @classmethod
    def from_document(cls, chat) -> "ChatSummaryResponse":
        return cls(
            id=str(chat.id),
            title=chat.title,
            message_count=len(chat.messages),
            created_at=chat.created_at,
            updated_at=chat.updated_at,
        )


class ChatListResponse(BaseModel):
    items: list[ChatSummaryResponse] = Field(..., description="List of chats")
    total: int = Field(..., description="Total number of chats")
    page: int = Field(..., description="Current page number")
    page_size: int = Field(..., description="Items per page")
    total_pages: int = Field(..., description="Total number of pages")

    @classmethod
    def create(
        cls,
        chats: list,
        total: int,
        page: int,
        page_size: int,
    ) -> "ChatListResponse":
        total_pages = (total + page_size - 1) // page_size if page_size > 0 else 0
        return cls(
            items=[ChatSummaryResponse.from_document(c) for c in chats],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )


class UpdateChatTitleRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=100, description="New chat title")


from app.core.schemas import MessageResponse
