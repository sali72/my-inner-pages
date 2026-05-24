from fastapi import WebSocket

from app.core.logging import get_logger

logger = get_logger(__name__)


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: dict[str, set[WebSocket]] = {}

    async def connect(self, ws: WebSocket, user_id: str) -> None:
        await ws.accept()
        self._connections.setdefault(user_id, set()).add(ws)
        logger.info("ws_connected", user_id=user_id)

    async def disconnect(self, ws: WebSocket, user_id: str) -> None:
        self._connections.get(user_id, set()).discard(ws)
        if not self._connections.get(user_id):
            self._connections.pop(user_id, None)
        logger.info("ws_disconnected", user_id=user_id)

    async def send_json(self, ws: WebSocket, data: dict) -> None:
        try:
            await ws.send_json(data)
        except Exception:
            pass
