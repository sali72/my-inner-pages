from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect
from beanie import PydanticObjectId
from typing import Optional

from app.ai.deps import get_chat_service, get_connection_manager
from app.ai.services.chat_service import ChatService
from app.ai.ws.manager import ConnectionManager
from app.auth.db.repository import UserRepository
from app.chat.deps import get_chat_persistence_service
from app.chat.service import ChatPersistenceService
from app.chat.history_manager import ChatHistoryManager
from app.chat.config import ChatModuleConfig
from app.chat.deps import get_chat_config
from app.core.deps.services import get_jwt_service
from app.core.logging import get_logger
from app.core.services.jwt_service import JWTService

logger = get_logger(__name__)

router = APIRouter()


def get_user_repository() -> UserRepository:
    return UserRepository()


@router.websocket("/chat/ws")
async def chat_websocket(
    websocket: WebSocket,
    token: str = Query(...),
    chat_id: Optional[str] = Query(None),
    jwt_service: JWTService = Depends(get_jwt_service),
    user_repository: UserRepository = Depends(get_user_repository),
    chat_service: ChatService = Depends(get_chat_service),
    connection_manager: ConnectionManager = Depends(get_connection_manager),
    chat_persistence: ChatPersistenceService = Depends(get_chat_persistence_service),
):
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

    await connection_manager.connect(websocket, str(user.id))

    actual_chat_id: Optional[str] = None
    running_history: list[dict] = []
    history_manager = ChatHistoryManager()

    if chat_id:
        chat, windowed_history = await chat_persistence.get_or_create_chat(
            str(user.id), chat_id=chat_id
        )
        actual_chat_id = str(chat.id)
        running_history = list(windowed_history)

    system_prompt = await chat_service.build_system_prompt(
        str(user.id), history=running_history
    )

    await connection_manager.send_json(websocket, {
        "type": "context_loaded",
        "chat_id": actual_chat_id,
    })

    try:
        async for data in websocket.iter_json():
            if data.get("type") != "message":
                continue

            user_msg = data["content"]

            if actual_chat_id is None:
                chat = await chat_persistence.create_chat(str(user.id))
                actual_chat_id = str(chat.id)

            await chat_persistence.append_message(
                actual_chat_id, str(user.id), "user", user_msg
            )

            full_response = ""

            async for event in chat_service.chat_stream(
                system_prompt, user_msg, running_history
            ):
                await connection_manager.send_json(websocket, event)
                if event["type"] == "token":
                    full_response += event["content"]

            if full_response:
                await chat_persistence.append_message(
                    actual_chat_id, str(user.id), "assistant", full_response
                )

            running_history.append({"role": "user", "content": user_msg})
            running_history.append({"role": "assistant", "content": full_response})
            running_history = history_manager.prepare_for_context(running_history)

            done_event: dict = {"type": "done"}
            if chat_id is None:
                done_event["chat_id"] = actual_chat_id
                chat_id = actual_chat_id

            await connection_manager.send_json(websocket, done_event)

    except (WebSocketDisconnect, RuntimeError):
        logger.info("ws_client_disconnected", user_id=str(user.id))
    except Exception:
        logger.exception("ws_unexpected_error", user_id=str(user.id))
        try:
            await connection_manager.send_json(
                websocket, {"type": "error", "content": "An unexpected error occurred"}
            )
        except RuntimeError:
            pass
    finally:
        await connection_manager.disconnect(websocket, str(user.id))
