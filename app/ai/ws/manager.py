import time
from dataclasses import dataclass, field
from typing import Optional

from fastapi import WebSocket

from app.core.logging import get_logger

logger = get_logger(__name__)


@dataclass
class ConnectionInfo:
    ws: WebSocket
    user_id: str
    connected_at: float = field(default_factory=time.monotonic)
    last_activity: float = field(default_factory=time.monotonic)
    last_pong: float = field(default_factory=time.monotonic)


class ConnectionManager:
    MAX_CONNECTIONS_PER_USER = 5

    def __init__(self) -> None:
        self._connections: dict[str, set[ConnectionInfo]] = {}
        self._ws_to_info: dict[int, ConnectionInfo] = {}

    async def connect(
        self,
        ws: WebSocket,
        user_id: str,
        is_resume: bool = False,
    ) -> None:
        await ws.accept()

        info = ConnectionInfo(ws=ws, user_id=user_id)

        if not is_resume:
            user_conns = self._connections.setdefault(user_id, set())
            if len(user_conns) >= self.MAX_CONNECTIONS_PER_USER:
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
        try:
            await ws.send_json({"type": "ping"})
            return True
        except Exception:
            return False

    def record_pong(self, ws: WebSocket) -> None:
        info = self._ws_to_info.get(id(ws))
        if info:
            now = time.monotonic()
            info.last_activity = now
            info.last_pong = now

    def get_info(self, ws: WebSocket) -> Optional[ConnectionInfo]:
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
