from typing import Optional

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, Query, WebSocket

from app.ai.config import AIModuleConfig
from app.ai.deps import (
    get_ai_config,
    get_chat_facade,
    get_connection_manager,
)
from app.ai.facade.chat_facade import ChatFacade
from app.ai.ws.manager import ConnectionManager
from app.auth.db.repository import UserRepository
from app.chat.deps import get_chat_facade as get_chat_persistence_facade
from app.chat.history_manager import ChatHistoryManager
from app.chat.facade import ChatPersistenceFacade
from app.core.deps.services import get_jwt_service
from app.core.logging import get_logger
from app.core.rate_limit import check_ws_rate_limit
from app.core.services.jwt_service import JWTService

logger = get_logger(__name__)

router = APIRouter()


def get_user_repository() -> UserRepository:
    return UserRepository()


@router.websocket("/chat/ws")
async def chat_websocket(
    websocket: WebSocket,
    token: Optional[str] = Query(None),
    chat_id: Optional[str] = Query(None),
    resume: bool = Query(False),
    jwt_service: JWTService = Depends(get_jwt_service),
    user_repository: UserRepository = Depends(get_user_repository),
    chat_facade: ChatFacade = Depends(get_chat_facade),
    connection_manager: ConnectionManager = Depends(get_connection_manager),
    chat_persistence: ChatPersistenceFacade = Depends(get_chat_persistence_facade),
    config: AIModuleConfig = Depends(get_ai_config),
):
    if not token:
        token = websocket.headers.get("sec-websocket-protocol", "")

    if not token:
        await websocket.close(code=4001)
        return

    try:
        payload = jwt_service.decode_token(token)
        user_id = payload.get("sub")
        if not user_id:
            await websocket.close(code=4001)
            return

        obj_id = PydanticObjectId(user_id)
        user = await user_repository.find_by_id(obj_id)
        if not user or not user.is_active:
            await websocket.close(code=4001)
            return
    except Exception:
        await websocket.close(code=4001)
        return

    ws_allowed, ws_retry_after = check_ws_rate_limit(f"ws:{str(user.id)}", config.ws_connect_rate_limit)
    if not ws_allowed:
        try:
            await websocket.send_json({
                "type": "error",
                "content": "Connection rate limited. Please wait.",
                "retry_after_seconds": ws_retry_after,
            })
        except Exception:
            pass
        await websocket.close(code=4003)
        return

    connection_manager.start_zombie_sweep()
    await connection_manager.connect(websocket, str(user.id), is_resume=resume)

    actual_chat_id: Optional[str] = None
    running_history: list[dict] = []
    history_manager = ChatHistoryManager()

    if chat_id:
        try:
            chat, windowed_history = await chat_persistence.get_or_create_chat(
                str(user.id), chat_id=chat_id,
            )
            actual_chat_id = str(chat.id)
            running_history = list(windowed_history)
        except Exception:
            logger.warning("chat_load_failed", chat_id=chat_id, user_id=str(user.id))

    await chat_facade.start_or_resume_session(
        websocket, str(user.id), actual_chat_id,
        running_history, history_manager, resume=resume,
    )
