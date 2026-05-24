from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect
from beanie import PydanticObjectId

from app.ai.deps import get_chat_service, get_connection_manager
from app.ai.services.chat_service import ChatService
from app.ai.ws.manager import ConnectionManager
from app.auth.db.repository import UserRepository
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
    jwt_service: JWTService = Depends(get_jwt_service),
    user_repository: UserRepository = Depends(get_user_repository),
    chat_service: ChatService = Depends(get_chat_service),
    connection_manager: ConnectionManager = Depends(get_connection_manager),
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

    try:
        system_prompt = await chat_service.build_system_prompt(str(user.id))
        await connection_manager.send_json(websocket, {"type": "context_loaded"})

        history: list[dict] = []

        async for data in websocket.iter_json():
            if data.get("type") != "message":
                continue

            user_msg = data["content"]
            full_response = ""

            async for event in chat_service.chat_stream(
                system_prompt, user_msg, history
            ):
                await connection_manager.send_json(websocket, event)
                if event["type"] == "token":
                    full_response += event["content"]

            history.append({"role": "user", "content": user_msg})
            history.append({"role": "assistant", "content": full_response})

    except WebSocketDisconnect:
        logger.info("ws_client_disconnected", user_id=str(user.id))
    except Exception:
        logger.exception("ws_unexpected_error", user_id=str(user.id))
        await connection_manager.send_json(
            websocket, {"type": "error", "content": "An unexpected error occurred"}
        )
    finally:
        await connection_manager.disconnect(websocket, str(user.id))
