import asyncio
import time
from typing import Optional

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect

from app.ai.config import AIModuleConfig
from app.ai.deps import (
    get_ai_config,
    get_chat_service,
    get_connection_manager,
    get_generation_manager,
    get_message_dedup_store,
)
from app.ai.services.chat_service import ChatService
from app.ai.ws.dedup import DedupStatus, MessageDedupStore
from app.ai.ws.generation_manager import GenerationManager
from app.ai.ws.manager import ConnectionManager
from app.auth.db.repository import UserRepository
from app.chat.deps import get_chat_persistence_service
from app.chat.history_manager import ChatHistoryManager
from app.chat.service import ChatPersistenceService
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
    chat_service: ChatService = Depends(get_chat_service),
    connection_manager: ConnectionManager = Depends(get_connection_manager),
    chat_persistence: ChatPersistenceService = Depends(get_chat_persistence_service),
    dedup_store: MessageDedupStore = Depends(get_message_dedup_store),
    generation_manager: GenerationManager = Depends(get_generation_manager),
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

    ws_allowed, ws_retry_after = check_ws_rate_limit(f"ws:{str(user.id)}", 20)
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
                str(user.id), chat_id=chat_id
            )
            actual_chat_id = str(chat.id)
            running_history = list(windowed_history)
        except Exception:
            logger.warning(
                "chat_load_failed", chat_id=chat_id, user_id=str(user.id),
            )

    if resume and actual_chat_id:
        gen = await generation_manager.attach_to_generation(
            str(user.id), actual_chat_id, websocket
        )
        if gen:
            logger.info(
                "ws_resume_attached",
                user_id=str(user.id),
                chat_id=actual_chat_id,
            )
            await connection_manager.send_json(websocket, {
                "type": "context_loaded",
                "chat_id": actual_chat_id,
            })
            heartbeat_task = asyncio.create_task(
                _heartbeat_loop(
                    websocket, connection_manager, generation_manager,
                    str(user.id), actual_chat_id, config,
                )
            )
            try:
                await _message_loop(
                    websocket, connection_manager, chat_service,
                    chat_persistence, dedup_store, generation_manager,
                    str(user.id), actual_chat_id, running_history,
                    history_manager, config, is_first_response=False,
                )
            finally:
                heartbeat_task.cancel()
                if actual_chat_id:
                    generation_manager.on_connection_lost(
                        str(user.id), actual_chat_id
                    )
                await connection_manager.disconnect(websocket, str(user.id))
            return

        await connection_manager.send_json(websocket, {
            "type": "generation_lost",
            "chat_id": actual_chat_id,
        })

    system_prompt = await chat_service.build_system_prompt(
        str(user.id), history=running_history
    )

    await connection_manager.send_json(websocket, {
        "type": "context_loaded",
        "chat_id": actual_chat_id,
    })

    is_first_response = chat_id is None

    heartbeat_task = asyncio.create_task(
        _heartbeat_loop(
            websocket, connection_manager, generation_manager,
            str(user.id), actual_chat_id, config,
        )
    )
    try:
        await _message_loop(
            websocket, connection_manager, chat_service,
            chat_persistence, dedup_store, generation_manager,
            str(user.id), actual_chat_id, running_history,
            history_manager, config, is_first_response,
        )
    finally:
        heartbeat_task.cancel()
        if actual_chat_id:
            generation_manager.on_connection_lost(str(user.id), actual_chat_id)
        await connection_manager.disconnect(websocket, str(user.id))


async def _heartbeat_loop(
    ws: WebSocket,
    connection_manager: ConnectionManager,
    generation_manager: GenerationManager,
    user_id: str,
    chat_id: Optional[str],
    config: AIModuleConfig,
) -> None:
    ping_interval = config.ws_ping_interval
    pong_timeout = config.ws_pong_timeout
    close_timeout = config.ws_connection_close_timeout

    while True:
        try:
            await asyncio.sleep(ping_interval)
        except asyncio.CancelledError:
            return

        info = connection_manager.get_info(ws)
        if info is None:
            if chat_id:
                generation_manager.on_connection_lost(user_id, chat_id)
            return

        now = time.monotonic()
        since_last_pong = now - info.last_pong

        if since_last_pong >= close_timeout:
            logger.warning(
                "ws_heartbeat_timeout",
                user_id=user_id,
                since_last_pong_seconds=since_last_pong,
            )
            if chat_id:
                generation_manager.on_connection_lost(user_id, chat_id)
            try:
                await ws.close()
            except Exception:
                pass
            return

        ok = await connection_manager.send_ping(ws)
        if not ok:
            if chat_id:
                generation_manager.on_connection_lost(user_id, chat_id)
            return

        if since_last_pong >= pong_timeout:
            await asyncio.sleep(2)

            info = connection_manager.get_info(ws)
            if info is None:
                if chat_id:
                    generation_manager.on_connection_lost(user_id, chat_id)
                return

            if time.monotonic() - info.last_pong >= pong_timeout:
                if chat_id:
                    generation_manager.on_connection_lost(user_id, chat_id)
                try:
                    await ws.close()
                except Exception:
                    pass
                return


async def _message_loop(
    ws: WebSocket,
    connection_manager: ConnectionManager,
    chat_service: ChatService,
    chat_persistence: ChatPersistenceService,
    dedup_store: MessageDedupStore,
    generation_manager: GenerationManager,
    user_id: str,
    actual_chat_id: Optional[str],
    running_history: list[dict],
    history_manager: ChatHistoryManager,
    config: AIModuleConfig,
    is_first_response: bool = True,
) -> None:
    MAX_MESSAGE_LENGTH = 10_000
    system_prompt: Optional[str] = None

    try:
        async for data in ws.iter_json():
            if not isinstance(data, dict):
                await connection_manager.send_json(ws, {
                    "type": "error",
                    "content": "Invalid message format",
                })
                continue

            msg_type = data.get("type")

            if msg_type == "pong":
                connection_manager.record_pong(ws)
                continue

            if msg_type == "ping":
                await connection_manager.send_json(ws, {"type": "pong"})
                continue

            if msg_type == "cancel":
                if actual_chat_id:
                    generation_manager.cancel_generation(user_id, actual_chat_id)
                continue

            message_id: Optional[str] = data.get("id")
            user_msg: str = data.get("content", "")

            if not user_msg or len(user_msg) > MAX_MESSAGE_LENGTH:
                await connection_manager.send_json(ws, {
                    "type": "error",
                    "content": "Message is empty or exceeds maximum length",
                })
                continue

            if msg_type == "edit":
                message_index = data.get("message_index")
                if actual_chat_id is None:
                    await connection_manager.send_json(ws, {
                        "type": "error",
                        "content": "Cannot edit: no active chat",
                    })
                    continue
                if message_index is not None and message_index >= 0:
                    keep = min(message_index, len(running_history))
                    running_history = running_history[:keep]
                    try:
                        await chat_persistence.truncate_messages(
                            actual_chat_id, user_id, keep
                        )
                    except Exception:
                        logger.exception(
                            "ws_edit_truncate_failed",
                            chat_id=actual_chat_id,
                            keep=keep,
                        )

            elif msg_type != "message":
                continue

            if actual_chat_id is None:
                chat = await chat_persistence.create_chat(user_id)
                actual_chat_id = str(chat.id)

            is_duplicate = False
            dup_status: Optional[DedupStatus] = None

            if message_id:
                is_duplicate, dup_status = dedup_store.check_or_set(
                    message_id, user_id, actual_chat_id
                )
                await connection_manager.send_json(ws, {
                    "type": "ack", "message_id": message_id,
                })

                if is_duplicate and dup_status == DedupStatus.COMPLETED:
                    continue

                if is_duplicate and dup_status == DedupStatus.PROCESSING:
                    gen = await generation_manager.attach_to_generation(
                        user_id, actual_chat_id, ws
                    )
                    if gen:
                        await gen.task
                        if gen.buffer and not gen.cancelled:
                            asyncio.ensure_future(
                                chat_persistence.append_message(
                                    actual_chat_id, user_id,
                                    "assistant", gen.buffer,
                                )
                            )
                            running_history.append(
                                {"role": "user", "content": user_msg}
                            )
                            running_history.append(
                                {"role": "assistant", "content": gen.buffer}
                            )
                            running_history[:] = (
                                history_manager.prepare_for_context(running_history)
                            )
                    continue
            else:
                await connection_manager.send_json(ws, {
                    "type": "ack", "message_id": "",
                })

            if system_prompt is None:
                system_prompt = await chat_service.build_system_prompt(
                    user_id, history=running_history
                )

            await chat_persistence.append_message(
                actual_chat_id, user_id, "user", user_msg
            )

            llm_allowed, llm_retry_after = check_ws_rate_limit(f"llm:{user_id}", 10)
            if not llm_allowed:
                await connection_manager.send_json(ws, {
                    "type": "error",
                    "content": "You're sending messages too quickly. Please wait a moment.",
                    "retry_after_seconds": llm_retry_after,
                })
                await chat_persistence.append_message(
                    actual_chat_id, user_id, "assistant",
                    "I'm sorry, but you've been sending messages too quickly. "
                    "Please wait a moment before continuing.",
                )
                continue

            t0 = time.monotonic()

            done_extra = None
            if is_first_response:
                done_extra = {"chat_id": actual_chat_id}
                is_first_response = False

            gen = await generation_manager.start_generation(
                ws=ws,
                user_id=user_id,
                chat_id=actual_chat_id,
                message_id=message_id or "",
                system_prompt=system_prompt,
                user_msg=user_msg,
                history=running_history,
                chat_service=chat_service,
                done_event_extra=done_extra,
            )

            await gen.task

            t1 = time.monotonic()
            duration_ms = round((t1 - t0) * 1000)
            logger.info(
                "ws_generation_complete",
                user_id=user_id,
                chat_id=actual_chat_id,
                duration_ms=duration_ms,
                message_length=len(gen.buffer),
            )

            if gen.buffer and not gen.cancelled:
                await chat_persistence.append_message(
                    actual_chat_id, user_id, "assistant", gen.buffer,
                )

            running_history.append({"role": "user", "content": user_msg})
            running_history.append({"role": "assistant", "content": gen.buffer or ""})
            running_history[:] = history_manager.prepare_for_context(running_history)

    except (WebSocketDisconnect, RuntimeError):
        logger.info("ws_client_disconnected", user_id=user_id)
    except Exception:
        logger.exception("ws_unexpected_error", user_id=user_id)
        try:
            await connection_manager.send_json(
                ws, {"type": "error", "content": "An unexpected error occurred"}
            )
        except RuntimeError:
            pass
