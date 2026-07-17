import asyncio
import time
from typing import Optional

from fastapi import WebSocket, WebSocketDisconnect

from app.ai.config import AIModuleConfig
from app.ai.services.chat_service import ChatService
from app.ai.ws.dedup import DedupStatus, MessageDedupStore
from app.ai.ws.generation_manager import GenerationManager
from app.ai.ws.manager import ConnectionManager
from app.chat.history_manager import ChatHistoryManager
from app.chat.service import ChatPersistenceService
from app.core.logging import get_logger
from app.core.rate_limit import check_ws_rate_limit

logger = get_logger(__name__)


class ChatFacade:
    """Business logic for the WebSocket chat session lifecycle.

    Orchestrates resume detection, heartbeat health-monitoring, the
    message-processing loop, and connection cleanup.  This is the "what"
    (business rules); the route is the "where" (auth, rate-limit, wiring).
    """

    def __init__(
        self,
        chat_service: ChatService,
        chat_persistence: ChatPersistenceService,
        connection_manager: ConnectionManager,
        generation_manager: GenerationManager,
        dedup_store: MessageDedupStore,
        config: AIModuleConfig,
    ) -> None:
        self._chat_service = chat_service
        self._chat_persistence = chat_persistence
        self._connection_manager = connection_manager
        self._generation_manager = generation_manager
        self._dedup_store = dedup_store
        self._config = config

    async def start_or_resume_session(
        self,
        ws: WebSocket,
        user_id: str,
        actual_chat_id: Optional[str],
        running_history: list[dict],
        history_manager: ChatHistoryManager,
        resume: bool = False,
    ) -> None:
        """Run the full chat session, optionally resuming an interrupted generation.

        When *resume* is ``True`` and *actual_chat_id* is set the facade
        first attempts to attach to an in-flight generation.  If the attach
        succeeds the session runs immediately (``is_first_response=False``).
        If it fails a ``generation_lost`` event is sent and a brand-new
        session starts.  When *resume* is ``False`` the session always
        starts fresh.
        """
        if resume and actual_chat_id:
            gen = await self._generation_manager.attach_to_generation(
                user_id, actual_chat_id, ws,
            )
            if gen:
                await self._connection_manager.send_json(ws, {
                    "type": "context_loaded",
                    "chat_id": actual_chat_id,
                })
                await self._run_session(
                    ws, user_id, actual_chat_id,
                    running_history, history_manager,
                    is_first_response=False,
                )
                return

            await self._connection_manager.send_json(ws, {
                "type": "generation_lost",
                "chat_id": actual_chat_id,
            })

        await self._connection_manager.send_json(ws, {
            "type": "context_loaded",
            "chat_id": actual_chat_id,
        })

        await self._run_session(
            ws, user_id, actual_chat_id,
            running_history, history_manager,
            is_first_response=actual_chat_id is None,
        )

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    async def _run_session(
        self,
        ws: WebSocket,
        user_id: str,
        actual_chat_id: Optional[str],
        running_history: list[dict],
        history_manager: ChatHistoryManager,
        is_first_response: bool,
    ) -> None:
        heartbeat_task = asyncio.create_task(
            self._heartbeat_loop(ws, user_id, actual_chat_id),
        )
        try:
            await self._message_loop(
                ws, user_id, actual_chat_id,
                running_history, history_manager,
                is_first_response,
            )
        finally:
            heartbeat_task.cancel()
            if actual_chat_id:
                self._generation_manager.on_connection_lost(user_id, actual_chat_id)
            await self._connection_manager.disconnect(ws, user_id)

    async def _heartbeat_loop(
        self,
        ws: WebSocket,
        user_id: str,
        chat_id: Optional[str],
    ) -> None:
        ping_interval = self._config.ws_ping_interval
        pong_timeout = self._config.ws_pong_timeout
        close_timeout = self._config.ws_connection_close_timeout

        while True:
            try:
                await asyncio.sleep(ping_interval)
            except asyncio.CancelledError:
                return

            info = self._connection_manager.get_info(ws)
            if info is None:
                if chat_id:
                    self._generation_manager.on_connection_lost(user_id, chat_id)
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
                    self._generation_manager.on_connection_lost(user_id, chat_id)
                try:
                    await ws.close()
                except Exception:
                    pass
                return

            ok = await self._connection_manager.send_ping(ws)
            if not ok:
                if chat_id:
                    self._generation_manager.on_connection_lost(user_id, chat_id)
                return

            if since_last_pong >= pong_timeout:
                await asyncio.sleep(2)

                info = self._connection_manager.get_info(ws)
                if info is None:
                    if chat_id:
                        self._generation_manager.on_connection_lost(user_id, chat_id)
                    return

                if time.monotonic() - info.last_pong >= pong_timeout:
                    if chat_id:
                        self._generation_manager.on_connection_lost(user_id, chat_id)
                    try:
                        await ws.close()
                    except Exception:
                        pass
                    return

    async def _message_loop(
        self,
        ws: WebSocket,
        user_id: str,
        actual_chat_id: Optional[str],
        running_history: list[dict],
        history_manager: ChatHistoryManager,
        is_first_response: bool = True,
    ) -> None:
        max_message_length = self._config.ws_max_message_length
        system_prompt: Optional[str] = None

        try:
            async for data in ws.iter_json():
                if not isinstance(data, dict):
                    await self._connection_manager.send_json(ws, {
                        "type": "error",
                        "content": "Invalid message format",
                    })
                    continue

                msg_type = data.get("type")

                if msg_type == "pong":
                    self._connection_manager.record_pong(ws)
                    continue

                if msg_type == "ping":
                    await self._connection_manager.send_json(ws, {"type": "pong"})
                    continue

                if msg_type == "cancel":
                    if actual_chat_id:
                        self._generation_manager.cancel_generation(user_id, actual_chat_id)
                    continue

                message_id: Optional[str] = data.get("id")
                user_msg: str = data.get("content", "")

                if not user_msg or len(user_msg) > max_message_length:
                    await self._connection_manager.send_json(ws, {
                        "type": "error",
                        "content": "Message is empty or exceeds maximum length",
                    })
                    continue

                if msg_type == "edit":
                    message_index = data.get("message_index")
                    if actual_chat_id is None:
                        await self._connection_manager.send_json(ws, {
                            "type": "error",
                            "content": "Cannot edit: no active chat",
                        })
                        continue
                    if message_index is not None and message_index >= 0:
                        keep = min(message_index, len(running_history))
                        running_history = running_history[:keep]
                        try:
                            await self._chat_persistence.truncate_messages(
                                actual_chat_id, user_id, keep,
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
                    chat = await self._chat_persistence.create_chat(user_id)
                    actual_chat_id = str(chat.id)

                if message_id:
                    result = self._dedup_store.check_or_set(message_id, user_id, actual_chat_id)
                    await self._connection_manager.send_json(ws, {
                        "type": "ack", "message_id": message_id,
                    })

                    if result.is_duplicate and result.status == DedupStatus.COMPLETED:
                        continue

                    if result.is_duplicate and result.status == DedupStatus.PROCESSING:
                        gen = await self._generation_manager.attach_to_generation(
                            user_id, actual_chat_id, ws,
                        )
                        if gen:
                            await gen.task
                            if gen.buffer and not gen.cancelled:
                                asyncio.create_task(self._safe_call(
                                    self._chat_persistence.append_message(
                                        actual_chat_id, user_id, "assistant", gen.buffer,
                                    ),
                                ))
                                running_history.append({"role": "user", "content": user_msg})
                                running_history.append({"role": "assistant", "content": gen.buffer})
                                running_history[:] = history_manager.prepare_for_context(running_history)
                        continue
                else:
                    await self._connection_manager.send_json(ws, {
                        "type": "ack", "message_id": "",
                    })

                if system_prompt is None:
                    system_prompt = await self._chat_service.build_system_prompt(
                        user_id, history=running_history,
                    )

                await self._chat_persistence.append_message(actual_chat_id, user_id, "user", user_msg)

                llm_allowed, llm_retry_after = check_ws_rate_limit(
                    f"llm:{user_id}", self._config.ws_llm_rate_limit,
                )
                if not llm_allowed:
                    await self._connection_manager.send_json(ws, {
                        "type": "error",
                        "content": "You're sending messages too quickly. Please wait a moment.",
                        "retry_after_seconds": llm_retry_after,
                    })
                    await self._chat_persistence.append_message(
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

                gen = await self._generation_manager.start_generation(
                    ws=ws,
                    user_id=user_id,
                    chat_id=actual_chat_id,
                    message_id=message_id or "",
                    system_prompt=system_prompt,
                    user_msg=user_msg,
                    history=running_history,
                    chat_service=self._chat_service,
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
                    await self._chat_persistence.append_message(
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
                await self._connection_manager.send_json(
                    ws, {"type": "error", "content": "An unexpected error occurred"},
                )
            except RuntimeError:
                pass

    async def _safe_call(self, coro) -> None:
        try:
            await coro
        except Exception:
            logger.exception("background_task_failed")
