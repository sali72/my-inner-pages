import time
from dataclasses import dataclass, field
from enum import Enum
from typing import NamedTuple, Optional


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


class DedupResult(NamedTuple):
    """Result of a dedup check.

    Attributes:
        is_duplicate: True if this message ID is already tracked.
        status: Current dedup status if duplicate, None if it's a new message.
    """

    is_duplicate: bool
    status: Optional[DedupStatus]


def _make_entry(message_id: str, user_id: str, chat_id: Optional[str], status: DedupStatus) -> DedupEntry:
    return DedupEntry(
        message_id=message_id,
        user_id=user_id,
        chat_id=chat_id,
        status=status,
        created_at=time.monotonic(),
    )


class MessageDedupStore:
    """Three-state message dedup with TTL-based expiry.

    Tracks message IDs through pending → processing → completed | aborted.
    Aborted messages can be retried (reset to pending).
    """

    def __init__(self, ttl: float = 300.0) -> None:
        self._ttl = ttl
        self._entries: dict[str, DedupEntry] = {}

    def check_or_set(self, message_id: str, user_id: str, chat_id: Optional[str] = None) -> DedupResult:
        """Check if message_id is a duplicate and update tracking state.

        Returns:
            DedupResult(is_duplicate=False, status=None) — new message, start processing
            DedupResult(is_duplicate=True, status=PROCESSING) — attach to existing generation
            DedupResult(is_duplicate=True, status=COMPLETED) — already processed, skip
            DedupResult(is_duplicate=False, status=ABORTED) — retry of aborted message
        """
        now = time.monotonic()
        entry = self._entries.get(message_id)

        if entry is None:
            self._entries[message_id] = _make_entry(message_id, user_id, chat_id, DedupStatus.PENDING)
            return DedupResult(is_duplicate=False, status=None)

        if now - entry.created_at > self._ttl:
            self._entries[message_id] = _make_entry(message_id, user_id, chat_id, DedupStatus.PENDING)
            return DedupResult(is_duplicate=False, status=None)

        if entry.status == DedupStatus.PENDING:
            return DedupResult(is_duplicate=True, status=DedupStatus.PROCESSING)

        if entry.status == DedupStatus.PROCESSING:
            return DedupResult(is_duplicate=True, status=DedupStatus.PROCESSING)

        if entry.status == DedupStatus.COMPLETED:
            return DedupResult(is_duplicate=True, status=DedupStatus.COMPLETED)

        if entry.status == DedupStatus.ABORTED:
            self._entries[message_id] = _make_entry(message_id, user_id, chat_id, DedupStatus.PENDING)
            return DedupResult(is_duplicate=False, status=DedupStatus.ABORTED)

        raise ValueError(f"Unknown dedup status: {entry.status}")

    def mark_processing(self, message_id: str) -> None:
        """Transition a pending entry to processing."""
        entry = self._entries.get(message_id)
        if entry and entry.status == DedupStatus.PENDING:
            entry.status = DedupStatus.PROCESSING

    def mark_completed(self, message_id: str) -> None:
        """Mark a message as fully processed."""
        entry = self._entries.get(message_id)
        if entry:
            entry.status = DedupStatus.COMPLETED

    def mark_aborted(self, message_id: str) -> None:
        """Mark a message as aborted (grace expired, cancelled)."""
        entry = self._entries.get(message_id)
        if entry:
            entry.status = DedupStatus.ABORTED

    def get_status(self, message_id: str) -> Optional[DedupStatus]:
        """Get the current dedup status for a message ID."""
        entry = self._entries.get(message_id)
        return entry.status if entry else None

    def cleanup_expired(self) -> int:
        """Remove entries older than TTL. Returns count removed."""
        now = time.monotonic()
        expired = [mid for mid, e in self._entries.items() if now - e.created_at > self._ttl]
        for mid in expired:
            del self._entries[mid]
        return len(expired)

    @property
    def size(self) -> int:
        return len(self._entries)
