import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


class DedupStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    ABORTED = "aborted"


@dataclass
class DedupEntry:
    message_id: str
    user_id: str
    chat_id: Optional[str]
    status: DedupStatus
    created_at: float


DedupResult = tuple[bool, Optional[DedupStatus]]
"""
First element: True if this is a duplicate (should NOT start a new generation)
Second element: current status if duplicate, None if new

DedupResult = (False, None)        → new message, start processing
DedupResult = (True, PROCESSING)   → duplicate, attach to existing generation
DedupResult = (True, COMPLETED)    → duplicate, skip entirely
DedupResult = (False, ABORTED)     → retry of aborted message, restart processing
"""


class MessageDedupStore:
    def __init__(self, ttl: float = 300.0) -> None:
        self._ttl = ttl
        self._entries: dict[str, DedupEntry] = {}

    def check_or_set(self, message_id: str, user_id: str, chat_id: Optional[str] = None) -> DedupResult:
        now = time.monotonic()
        entry = self._entries.get(message_id)

        if entry is None:
            self._entries[message_id] = DedupEntry(
                message_id=message_id,
                user_id=user_id,
                chat_id=chat_id,
                status=DedupStatus.PENDING,
                created_at=now,
            )
            return (False, None)

        if now - entry.created_at > self._ttl:
            self._entries[message_id] = DedupEntry(
                message_id=message_id,
                user_id=user_id,
                chat_id=chat_id,
                status=DedupStatus.PENDING,
                created_at=now,
            )
            return (False, None)

        if entry.status == DedupStatus.PENDING:
            return (True, DedupStatus.PROCESSING)

        if entry.status == DedupStatus.PROCESSING:
            return (True, DedupStatus.PROCESSING)

        if entry.status == DedupStatus.COMPLETED:
            return (True, DedupStatus.COMPLETED)

        if entry.status == DedupStatus.ABORTED:
            self._entries[message_id] = DedupEntry(
                message_id=message_id,
                user_id=user_id,
                chat_id=chat_id,
                status=DedupStatus.PENDING,
                created_at=now,
            )
            return (False, DedupStatus.ABORTED)

        return (False, None)

    def mark_processing(self, message_id: str) -> None:
        entry = self._entries.get(message_id)
        if entry and entry.status == DedupStatus.PENDING:
            entry.status = DedupStatus.PROCESSING

    def mark_completed(self, message_id: str) -> None:
        entry = self._entries.get(message_id)
        if entry:
            entry.status = DedupStatus.COMPLETED

    def mark_aborted(self, message_id: str) -> None:
        entry = self._entries.get(message_id)
        if entry:
            entry.status = DedupStatus.ABORTED

    def get_status(self, message_id: str) -> Optional[DedupStatus]:
        entry = self._entries.get(message_id)
        return entry.status if entry else None

    def cleanup_expired(self) -> int:
        now = time.monotonic()
        expired = [mid for mid, e in self._entries.items() if now - e.created_at > self._ttl]
        for mid in expired:
            del self._entries[mid]
        return len(expired)

    @property
    def size(self) -> int:
        return len(self._entries)
