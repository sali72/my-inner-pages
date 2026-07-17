import asyncio
import time
from dataclasses import dataclass, field
from typing import Optional

from fastapi import WebSocket

from app.ai.services.chat_service import ChatService
from app.ai.ws.dedup import MessageDedupStore
from app.core.logging import get_logger

logger = get_logger(__name__)


@dataclass
class ActiveGeneration:
    task: asyncio.Task
    ws: Optional[WebSocket]
    buffer: str = ""
    done: bool = False
    cancelled: bool = False
    start_time: float = field(default_factory=time.monotonic)
    last_activity: float = field(default_factory=time.monotonic)
    message_id: str = ""
    user_id: str = ""
    chat_id: str = ""
    done_event_extra: Optional[dict] = None


class GenerationManager:
    def __init__(
        self,
        grace_period: float = 10.0,
        dedup_store: Optional[MessageDedupStore] = None,
    ) -> None:
        self._grace_period = grace_period
        self._dedup_store = dedup_store
        self._generations: dict[tuple[str, str], ActiveGeneration] = {}
        self._grace_timers: dict[tuple[str, str], asyncio.Task] = {}

    async def start_generation(
        self,
        ws: WebSocket,
        user_id: str,
        chat_id: str,
        message_id: str,
        system_prompt: str,
        user_msg: str,
        history: list[dict],
        chat_service: ChatService,
        done_event_extra: Optional[dict] = None,
    ) -> ActiveGeneration:
        key = (user_id, chat_id)

        existing = self._generations.get(key)
        if existing and not existing.done:
            existing.cancelled = True
            existing.task.cancel()
            self._cancel_grace_timer(key)

        gen = ActiveGeneration(
            task=asyncio.get_running_loop().create_future(),  # placeholder
            ws=ws,
            message_id=message_id,
            user_id=user_id,
            chat_id=chat_id,
            done_event_extra=done_event_extra,
        )
        self._generations[key] = gen

        if self._dedup_store:
            self._dedup_store.mark_processing(message_id)

        gen.task = asyncio.create_task(
            self._run_generation(gen, system_prompt, user_msg, history, chat_service)
        )

        logger.info(
            "generation_started",
            user_id=user_id,
            chat_id=chat_id,
            message_id=message_id,
        )
        return gen

    async def _run_generation(
        self,
        gen: ActiveGeneration,
        system_prompt: str,
        user_msg: str,
        history: list[dict],
        chat_service: ChatService,
    ) -> None:
        try:
            async for event in chat_service.chat_stream(system_prompt, user_msg, history):
                if gen.cancelled:
                    break

                if event["type"] == "token":
                    gen.buffer += event["content"]

                await self._try_send(gen, event)

            if not gen.cancelled:
                done_event: dict = {"type": "done"}
                if gen.done_event_extra:
                    done_event.update(gen.done_event_extra)
                await self._try_send(gen, done_event)

        except asyncio.CancelledError:
            gen.cancelled = True
        except Exception:
            logger.exception(
                "generation_crashed",
                user_id=gen.user_id,
                chat_id=gen.chat_id,
            )
            gen.cancelled = True
            await self._try_send(gen, {"type": "error", "content": "An unexpected error occurred"})
        finally:
            gen.done = True
            if gen.cancelled:
                if self._dedup_store:
                    self._dedup_store.mark_aborted(gen.message_id)
                self._cleanup_generation((gen.user_id, gen.chat_id))
            else:
                if self._dedup_store:
                    self._dedup_store.mark_completed(gen.message_id)

    async def _try_send(self, gen: ActiveGeneration, event: dict) -> None:
        if gen.ws is not None:
            try:
                await gen.ws.send_json(event)
                gen.last_activity = time.monotonic()
            except Exception:
                gen.ws = None

    async def attach_to_generation(
        self,
        user_id: str,
        chat_id: str,
        ws: WebSocket,
    ) -> Optional[ActiveGeneration]:
        key = (user_id, chat_id)
        gen = self._generations.get(key)

        if gen is None or gen.cancelled:
            return None

        self._cancel_grace_timer(key)

        gen.ws = ws
        gen.last_activity = time.monotonic()

        try:
            await ws.send_json({"type": "generation_resumed"})
        except Exception:
            gen.ws = None
            return None

        if gen.buffer:
            try:
                await ws.send_json({"type": "token", "content": gen.buffer})
            except Exception:
                gen.ws = None
                return None

        if gen.done:
            done_event: dict = {"type": "done"}
            if gen.done_event_extra:
                done_event.update(gen.done_event_extra)
            try:
                await ws.send_json(done_event)
            except Exception:
                gen.ws = None
                return None

        logger.info(
            "generation_resumed",
            user_id=user_id,
            chat_id=chat_id,
        )
        return gen

    def on_connection_lost(self, user_id: str, chat_id: str) -> None:
        key = (user_id, chat_id)
        gen = self._generations.get(key)
        if gen is None or gen.done:
            return

        if key in self._grace_timers:
            return

        self._grace_timers[key] = asyncio.create_task(self._grace_timer(key))
        logger.info(
            "generation_grace_started",
            user_id=user_id,
            chat_id=chat_id,
        )

    async def _grace_timer(self, key: tuple[str, str]) -> None:
        try:
            await asyncio.sleep(self._grace_period)
        except asyncio.CancelledError:
            return

        gen = self._generations.get(key)
        if gen is None or gen.done:
            return

        gen.cancelled = True
        gen.task.cancel()

        if self._dedup_store:
            self._dedup_store.mark_aborted(gen.message_id)

        logger.info(
            "generation_grace_expired",
            user_id=key[0],
            chat_id=key[1],
        )
        self._cleanup_generation(key)

    def cancel_generation(self, user_id: str, chat_id: str) -> bool:
        key = (user_id, chat_id)
        gen = self._generations.get(key)
        if gen is None or gen.done:
            return False

        gen.cancelled = True
        gen.task.cancel()
        self._cancel_grace_timer(key)

        if self._dedup_store:
            self._dedup_store.mark_aborted(gen.message_id)

        logger.info("generation_cancelled", user_id=user_id, chat_id=chat_id)
        self._cleanup_generation(key)
        return True

    def is_active(self, user_id: str, chat_id: str) -> bool:
        key = (user_id, chat_id)
        gen = self._generations.get(key)
        return gen is not None and not gen.done and not gen.cancelled

    def _cancel_grace_timer(self, key: tuple[str, str]) -> None:
        timer = self._grace_timers.pop(key, None)
        if timer is not None and not timer.done():
            timer.cancel()

    def _cleanup_generation(self, key: tuple[str, str]) -> None:
        self._generations.pop(key, None)
        self._grace_timers.pop(key, None)

    @property
    def active_count(self) -> int:
        return len(self._generations)

    def cleanup_expired(self) -> None:
        now = time.monotonic()
        stale = [
            k
            for k, g in self._generations.items()
            if g.done and now - g.last_activity > 60
        ]
        for k in stale:
            self._cleanup_generation(k)
