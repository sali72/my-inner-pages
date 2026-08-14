import json
import base64
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from bson import ObjectId
from beanie import PydanticObjectId
from beanie.odm.queries.update import UpdateResponse
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
        title: Optional[str],
        content_json: Dict[str, Any],
        content_text: str = "",
        tags: Optional[list[str]] = None,
        rumination_index: Optional[float] = None,
        created_at: Optional[datetime] = None,
    ) -> Journal:
        try:
            journal = Journal(
                user_id=user_id,
                title=title,
                content_json=content_json,
                content_text=content_text,
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

    def _decode_cursor(self, cursor: str) -> Optional[tuple[datetime, ObjectId]]:
        try:
            raw = base64.b64decode(cursor).decode()
            data = json.loads(raw)
            return datetime.fromisoformat(data["c"]), ObjectId(data["i"])
        except (ValueError, json.JSONDecodeError, KeyError, Exception):
            logger.warning("invalid_cursor", cursor=cursor[:50])
            return None

    def _encode_cursor(self, created_at: datetime, doc_id: ObjectId) -> str:
        raw = json.dumps({"c": created_at.isoformat(), "i": str(doc_id)})
        return base64.b64encode(raw.encode()).decode()

    async def find_all_by_user(
        self,
        user_id: str,
        cursor: Optional[str] = None,
        limit: int = 20,
        tags: Optional[list[str]] = None,
        tag_mode: str = "or",
    ) -> tuple[list[Journal], Optional[str]]:
        try:
            query: dict = {"user_id": user_id}
            if tags:
                operator = "$all" if tag_mode == "and" else "$in"
                query["tags"] = {operator: tags}
            if cursor:
                decoded = self._decode_cursor(cursor)
                if decoded is None:
                    return [], None
                cursor_created_at, cursor_id = decoded
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
        content_json: Optional[Dict[str, Any]] = None,
        content_text: Optional[str] = None,
        tags: Optional[list[str]] = None,
        rumination_index: Optional[float] = None,
        created_at: Optional[datetime] = None,
    ) -> Optional[Journal]:
        try:
            update_data = {"updated_at": datetime.now(timezone.utc)}

            if title is not None:
                update_data["title"] = title
            if content_json is not None:
                update_data["content_json"] = content_json
            if content_text is not None:
                update_data["content_text"] = content_text
            if tags is not None:
                update_data["tags"] = tags
            if rumination_index is not None:
                update_data["rumination_index"] = rumination_index
            if created_at is not None:
                update_data["created_at"] = created_at

            journal = await self.model.find_one({"_id": journal_id, "user_id": user_id}).update(
                {"$set": update_data},
                response_type=UpdateResponse.NEW_DOCUMENT,
            )
            if journal:
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
            res = await self.model.find_one({"_id": journal_id, "user_id": user_id}).delete()
            if res and res.deleted_count > 0:
                logger.info("journal_deleted", journal_id=str(journal_id), user_id=user_id)
                return True
            return False
        except PyMongoError as e:
            logger.error("journal_delete_failed", error=str(e), journal_id=str(journal_id))
            raise RepositoryException(
                f"Failed to delete journal: {str(e)}",
                details={"journal_id": str(journal_id), "error": str(e)}
            )
