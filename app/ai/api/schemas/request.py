from typing import Optional
from pydantic import BaseModel, Field


class ChatStreamRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=10000, description="User message content")
    chat_id: Optional[str] = Field(None, description="ID of existing chat session if available")
    message_id: Optional[str] = Field(None, description="Optional message ID for client tracking")
    edit_message_index: Optional[int] = Field(None, description="Optional index if editing previous message")
