from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.ai.api.schemas.request import ChatStreamRequest
from app.ai.deps import get_chat_facade
from app.ai.facade.chat_facade import ChatFacade
from app.auth.db.models import User
from app.auth.deps import get_current_user
from app.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter()


@router.post("/chat/stream")
async def chat_stream(
    payload: ChatStreamRequest,
    current_user: User = Depends(get_current_user),
    chat_facade: ChatFacade = Depends(get_chat_facade),
):
    """Stream AI chat response via Server-Sent Events (SSE)."""
    return StreamingResponse(
        chat_facade.stream_chat(
            user_id=str(current_user.id),
            content=payload.content,
            chat_id=payload.chat_id,
            message_id=payload.message_id,
            edit_message_index=payload.edit_message_index,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
