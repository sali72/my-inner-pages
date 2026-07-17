import asyncio
import time
from dataclasses import dataclass, field

from fastapi import WebSocket

from app.core.logging import get_logger

logger = get_logger(__name__)


@dataclass
class ConnectionInfo:
    """Tracks a single WebSocket connection's metadata."""

    ws: WebSocket
    user_id: str
    connected_at: float = field(default_factory=time.monotonic)
    last_activity: float = field(default_factory=time.monotonic)
    last_pong: float = field(default_factory=time.monotonic)

    def __hash__(self) -> int:
        return id(self.ws)

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, ConnectionInfo):
            return NotImplemented
        return id(self.ws) == id(other.ws)


class ConnectionManager:
    """Manages WebSocket connections per user with cap/eviction, zombie cleanup, and ping/pong."""

    def __init__(self, max_connections_per_user: int = 5) -> None:
        self._max_connections_per_user = max_connections_per_user
        self._connections: dict[str, set[ConnectionInfo]] = {}
        self._ws_to_info: dict[int, ConnectionInfo] = {}
        self._sweep_task: asyncio.Task | None = None

    def start_zombie_sweep(self) -> None:
        """Start the periodic zombie cleanup loop (idempotent)."""
        if self._sweep_task is None:
            self._sweep_task = asyncio.create_task(self._zombie_sweep_loop())

    async def stop_zombie_sweep(self) -> None:
        """Cancel and await the zombie sweep loop."""
        if self._sweep_task is not None:
            self._sweep_task.cancel()
            try:
                await self._sweep_task
            except asyncio.CancelledError:
                pass
            self._sweep_task = None

    async def _zombie_sweep_loop(self) -> None:
        """Periodic loop: close connections idle longer than 5 minutes."""
        while True:
            await asyncio.sleep(60)
            await self._cleanup_zombies(max_idle_seconds=300)

    async def _cleanup_zombies(self, max_idle_seconds: float = 300) -> int:
        """Close and remove connections idle longer than max_idle_seconds."""
        now = time.monotonic()
        to_close: list[WebSocket] = []
        for conn_id, info in list(self._ws_to_info.items()):
            if now - info.last_activity > max_idle_seconds:
                to_close.append(info.ws)
                user_conns = self._connections.get(info.user_id)
                if user_conns:
                    user_conns.discard(info)
                    if not user_conns:
                        del self._connections[info.user_id]
                del self._ws_to_info[conn_id]

        for ws in to_close:
            try:
                await ws.close(code=1000)
            except Exception:
                pass

        if to_close:
            logger.warning(
                "ws_zombie_cleanup",
                closed_count=len(to_close),
                max_idle_seconds=max_idle_seconds,
            )

        return len(to_close)

    async def connect(
        self,
        ws: WebSocket,
        user_id: str,
        is_resume: bool = False,
    ) -> None:
        """Accept and register a new WebSocket connection.

        Args:
            ws: The WebSocket to register.
            user_id: Authenticated user ID.
            is_resume: If True, skip the per-user connection cap.
        """
        await ws.accept()

        info = ConnectionInfo(ws=ws, user_id=user_id)

        if not is_resume:
            user_conns = self._connections.setdefault(user_id, set())
            if len(user_conns) >= self._max_connections_per_user:
                oldest = min(user_conns, key=lambda c: c.connected_at)
                user_conns.discard(oldest)
                self._ws_to_info.pop(id(oldest.ws), None)
                logger.warning(
                    "ws_connection_cap_evicted",
                    user_id=user_id,
                    evicted_id=id(oldest.ws),
                )

            user_conns.add(info)
        else:
            self._connections.setdefault(user_id, set()).add(info)

        self._ws_to_info[id(ws)] = info
        logger.info(
            "ws_connected",
            user_id=user_id,
            conn_id=id(ws),
            is_resume=is_resume,
        )

    async def disconnect(self, ws: WebSocket, user_id: str) -> None:
        """Remove a WebSocket from all tracking structures."""
        conn_id = id(ws)
        info = self._ws_to_info.pop(conn_id, None)
        if info:
            user_conns = self._connections.get(user_id)
            if user_conns:
                user_conns.discard(info)
                if not user_conns:
                    del self._connections[user_id]

        logger.info("ws_disconnected", user_id=user_id, conn_id=conn_id)

    async def send_json(self, ws: WebSocket, data: dict) -> None:
        """Send JSON and update last_activity on success."""
        try:
            await ws.send_json(data)
            info = self._ws_to_info.get(id(ws))
            if info:
                info.last_activity = time.monotonic()
        except Exception:
            logger.warning(
                "ws_send_failed",
                conn_id=id(ws),
                error_type="send_failed",
            )

    async def send_ping(self, ws: WebSocket) -> bool:
        """Send a ping frame. Returns True on success."""
        try:
            await ws.send_json({"type": "ping"})
            return True
        except Exception:
            return False

    def record_pong(self, ws: WebSocket) -> None:
        """Record a pong response — updates both last_activity and last_pong."""
        info = self._ws_to_info.get(id(ws))
        if info:
            now = time.monotonic()
            info.last_activity = now
            info.last_pong = now

    def get_info(self, ws: WebSocket) -> ConnectionInfo | None:
        """Look up ConnectionInfo for a WebSocket."""
        return self._ws_to_info.get(id(ws))

    def update_activity(self, ws: WebSocket) -> None:
        info = self._ws_to_info.get(id(ws))
        if info:
            info.last_activity = time.monotonic()

    @property
    def active_count(self) -> int:
        return sum(len(conns) for conns in self._connections.values())

    @property
    def connections_per_user(self) -> dict[str, int]:
        return {uid: len(conns) for uid, conns in self._connections.items()}
