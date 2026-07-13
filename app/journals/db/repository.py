import json
import base64
from datetime import datetime
from typing import Optional
from bson import ObjectId
from beanie import PydanticObjectId
from beanie.operators import In, Set
from pymongo.errors import PyMongoError, DuplicateKeyError

from app.journals.db.models import Journal
from app.core.exceptions import RepositoryException, DocumentNotFoundException
from app.core.logging import get_logger

logger = get_logger(__name__)


class JournalRepository:
    """Repository for journal data access operations."""

    def __init__(self):
        self.model = Journal

    async def create(
        self,
        user_id: str,
        title: str,
        content: str,
        tags: Optional[list[str]] = None,
        rumination_index: Optional[float] = None,
        created_at: Optional[datetime] = None,
    ) -> Journal:
        try:
            journal = Journal(
                user_id=user_id,
                title=title,
                content=content,
                tags=tags or [],
                rumination_index=rumination_index,
            )
            if created_at is not None:
                journal.created_at = created_at
            await journal.insert()
            logger.info("journal_created", journal_id=str(journal.id), user_id=user_id)
            return journal
        except PyMongoError as e:
            logger.error("journal_create_failed", error=str(e), user_id=user_id)
            raise RepositoryException(
                f"Failed to create journal: {str(e)}",
                details={"user_id": user_id, "error": str(e)}
            )

    async def find_by_id(
        self,
        journal_id: PydanticObjectId,
        user_id: str,
    ) -> Optional[Journal]:
        try:
            query = {"_id": journal_id, "user_id": user_id}
            return await self.model.find_one(query)
        except PyMongoError as e:
            logger.error("journal_find_failed", error=str(e), journal_id=str(journal_id))
            raise RepositoryException(
                f"Failed to find journal: {str(e)}",
                details={"journal_id": str(journal_id), "error": str(e)}
            )

    def _decode_cursor(self, cursor: str) -> tuple[datetime, ObjectId]:
        raw = base64.b64decode(cursor).decode()
        data = json.loads(raw)
        return datetime.fromisoformat(data["c"]), ObjectId(data["i"])

    def _encode_cursor(self, created_at: datetime, doc_id: ObjectId) -> str:
        raw = json.dumps({"c": created_at.isoformat(), "i": str(doc_id)})
        return base64.b64encode(raw.encode()).decode()

    async def find_all_by_user(
        self,
        user_id: str,
        cursor: Optional[str] = None,
        limit: int = 20,
    ) -> tuple[list[Journal], Optional[str]]:
        try:
            query: dict = {"user_id": user_id}
            if cursor:
                cursor_created_at, cursor_id = self._decode_cursor(cursor)
                query["$or"] = [
                    {"created_at": {"$lt": cursor_created_at}},
                    {
                        "created_at": cursor_created_at,
                        "_id": {"$lt": cursor_id},
                    },
                ]
            journals = await (
                self.model.find(query)
                .sort([("created_at", -1), ("_id", -1)])
                .limit(limit + 1)
                .to_list()
            )
            has_more = len(journals) > limit
            if has_more:
                journals = journals[:limit]
            next_cursor = None
            if has_more:
                last = journals[-1]
                next_cursor = self._encode_cursor(last.created_at, last.id)
            return journals, next_cursor
        except PyMongoError as e:
            logger.error("journal_list_failed", error=str(e), user_id=user_id)
            raise RepositoryException(
                f"Failed to list journals: {str(e)}",
                details={"user_id": user_id, "error": str(e)}
            )

    async def count_by_user(
        self,
        user_id: str,
    ) -> int:
        try:
            query = {"user_id": user_id}
            return await self.model.find(query).count()
        except PyMongoError as e:
            logger.error("journal_count_failed", error=str(e), user_id=user_id)
            raise RepositoryException(
                f"Failed to count journals: {str(e)}",
                details={"user_id": user_id, "error": str(e)}
            )

    async def update(
        self,
        journal_id: PydanticObjectId,
        user_id: str,
        title: Optional[str] = None,
        content: Optional[str] = None,
        tags: Optional[list[str]] = None,
        rumination_index: Optional[float] = None,
        created_at: Optional[datetime] = None,
    ) -> Optional[Journal]:
        try:
            journal = await self.find_by_id(journal_id, user_id)
            if not journal:
                return None

            update_data = {"updated_at": datetime.utcnow()}

            if title is not None:
                update_data["title"] = title
            if content is not None:
                update_data["content"] = content
            if tags is not None:
                update_data["tags"] = tags
            if rumination_index is not None:
                update_data["rumination_index"] = rumination_index
            if created_at is not None:
                update_data["created_at"] = created_at

            await journal.set(update_data)
            logger.info("journal_updated", journal_id=str(journal_id), user_id=user_id)
            return journal
        except PyMongoError as e:
            logger.error("journal_update_failed", error=str(e), journal_id=str(journal_id))
            raise RepositoryException(
                f"Failed to update journal: {str(e)}",
                details={"journal_id": str(journal_id), "error": str(e)}
            )

    async def delete(
        self,
        journal_id: PydanticObjectId,
        user_id: str,
    ) -> bool:
        try:
            journal = await self.find_by_id(journal_id, user_id)
            if not journal:
                return False

            await journal.delete()
            logger.info("journal_deleted", journal_id=str(journal_id), user_id=user_id)
            return True
        except PyMongoError as e:
            logger.error("journal_delete_failed", error=str(e), journal_id=str(journal_id))
            raise RepositoryException(
                f"Failed to delete journal: {str(e)}",
                details={"journal_id": str(journal_id), "error": str(e)}
            )
