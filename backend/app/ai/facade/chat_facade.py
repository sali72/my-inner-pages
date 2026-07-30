import asyncio
import json
import time
from collections.abc import AsyncGenerator
from typing import Optional

from app.ai.config import AIModuleConfig
from app.ai.services.chat_service import ChatService
from app.chat.facade import ChatPersistenceFacade
from app.chat.history_manager import ChatHistoryManager
from app.core.logging import get_logger
from app.core.rate_limit import check_rate_limit

logger = get_logger(__name__)


class ChatFacade:
    """Business logic for the SSE chat streaming session lifecycle."""

    def __init__(
        self,
        chat_service: ChatService,
        chat_persistence: ChatPersistenceFacade,
        config: AIModuleConfig,
    ) -> None:
        self._chat_service = chat_service
        self._chat_persistence = chat_persistence
        self._config = config

    async def stream_chat(
        self,
        user_id: str,
        content: str,
        chat_id: Optional[str] = None,
        message_id: Optional[str] = None,
        edit_message_index: Optional[int] = None,
    ) -> AsyncGenerator[str, None]:
        """Stream AI chat response as SSE events.

        Yields SSE-formatted strings:
        - event: context_loaded
        - event: ack
        - event: token
        - event: done
        - event: error
        """

        def format_sse(event: str, data: dict) -> str:
            return f"event: {event}\ndata: {json.dumps(data)}\n\n"

        # Rate limit check for LLM generation per user
        llm_allowed, llm_retry_after = check_rate_limit(
            f"llm:{user_id}", self._config.llm_rate_limit
        )
        if not llm_allowed:
            yield format_sse(
                "error",
                {
                    "content": "You're sending messages too quickly. Please wait a moment.",
                    "retry_after_seconds": llm_retry_after,
                },
            )
            return

        actual_chat_id = chat_id
        running_history: list[dict] = []
        is_first_response = False

        if actual_chat_id:
            try:
                chat, windowed_history = await self._chat_persistence.get_or_create_chat(
                    user_id, chat_id=actual_chat_id
                )
                running_history = list(windowed_history)
            except Exception:
                logger.warning("chat_load_failed", chat_id=actual_chat_id, user_id=user_id)
                actual_chat_id = None

        if not actual_chat_id:
            chat = await self._chat_persistence.create_chat(user_id)
            actual_chat_id = str(chat.id)
            is_first_response = True

        yield format_sse("context_loaded", {"chat_id": actual_chat_id})

        # Handle edit truncation if specified
        if edit_message_index is not None and edit_message_index >= 0:
            keep = min(edit_message_index, len(running_history))
            running_history = running_history[:keep]
            try:
                await self._chat_persistence.truncate_messages(
                    actual_chat_id, user_id, keep
                )
            except Exception:
                logger.exception("edit_truncate_failed", chat_id=actual_chat_id, keep=keep)

        # Send ACK if message_id provided
        if message_id:
            yield format_sse("ack", {"message_id": message_id})

        # Append user message
        await self._chat_persistence.append_message(actual_chat_id, user_id, "user", content)

        # Build system prompt
        system_prompt = await self._chat_service.build_system_prompt(
            user_id, history=running_history
        )

        buffer: list[str] = []
        t0 = time.monotonic()
        aborted = False

        try:
            async for event in self._chat_service.chat_stream(
                system_prompt=system_prompt,
                user_message=content,
                history=running_history,
            ):
                if event.get("type") == "token":
                    token_text = event.get("content", "")
                    buffer.append(token_text)
                    yield format_sse("token", {"content": token_text})
        except asyncio.CancelledError:
            aborted = True
            logger.info("stream_cancelled_by_client", user_id=user_id, chat_id=actual_chat_id)
            raise
        except Exception:
            logger.exception("stream_generation_failed", user_id=user_id, chat_id=actual_chat_id)
            yield format_sse(
                "error", {"content": "An unexpected error occurred during generation."}
            )
            return
        finally:
            full_response = "".join(buffer)
            duration_ms = round((time.monotonic() - t0) * 1000)
            logger.info(
                "sse_generation_complete",
                user_id=user_id,
                chat_id=actual_chat_id,
                duration_ms=duration_ms,
                message_length=len(full_response),
                aborted=aborted,
            )

            if full_response:
                await self._chat_persistence.append_message(
                    actual_chat_id, user_id, "assistant", full_response
                )

        done_payload: dict = {"chat_id": actual_chat_id}
        if is_first_response:
            done_payload["is_first"] = True

        yield format_sse("done", done_payload)
