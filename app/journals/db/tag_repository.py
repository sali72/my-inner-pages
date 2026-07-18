import re
from typing import Optional
from beanie.operators import In
from pymongo.errors import PyMongoError

from app.journals.db.tag_model import Tag
from app.journals.db.models import Journal
from app.core.exceptions import RepositoryException
from app.core.logging import get_logger


logger = get_logger(__name__)


class TagRepository:
    def __init__(self):
        self.model = Tag

    async def upsert_tags(self, user_id: str, tags: list[str]) -> None:
        if not tags:
            return
        try:
            for name in tags:
                existing = await self.model.find_one(
                    {"user_id": user_id, "name": name}
                )
                if existing:
                    existing.usage_count += 1
                    await existing.save()
                else:
                    tag = Tag(user_id=user_id, name=name, usage_count=1)
                    await tag.insert()
        except PyMongoError as e:
            logger.error("tag_upsert_failed", error=str(e), user_id=user_id)
            raise RepositoryException(
                f"Failed to upsert tags: {str(e)}",
                details={"user_id": user_id, "error": str(e)},
            )

    async def remove_tags(self, user_id: str, tags: list[str]) -> None:
        if not tags:
            return
        try:
            for name in tags:
                existing = await self.model.find_one(
                    {"user_id": user_id, "name": name}
                )
                if existing:
                    existing.usage_count -= 1
                    if existing.usage_count <= 0:
                        await existing.delete()
                    else:
                        await existing.save()
        except PyMongoError as e:
            logger.error("tag_remove_failed", error=str(e), user_id=user_id)
            raise RepositoryException(
                f"Failed to remove tags: {str(e)}",
                details={"user_id": user_id, "error": str(e)},
            )

    async def replace_tags(
        self, user_id: str, old_tags: list[str], new_tags: list[str]
    ) -> None:
        old_set = set(old_tags)
        new_set = set(new_tags)

        removed = list(old_set - new_set)
        added = list(new_set - old_set)

        if removed:
            await self.remove_tags(user_id, removed)
        if added:
            await self.upsert_tags(user_id, added)

    async def list_tags(
        self,
        user_id: str,
        query: Optional[str] = None,
        limit: int = 50,
    ) -> list[Tag]:
        try:
            filter_dict: dict = {"user_id": user_id}
            if query:
                escaped = re.escape(query)
                filter_dict["name"] = {"$regex": f"^{escaped}", "$options": "i"}
            return await (
                self.model.find(filter_dict)
                .sort("name")
                .limit(limit)
                .to_list()
            )
        except PyMongoError as e:
            logger.error("tag_list_failed", error=str(e), user_id=user_id)
            raise RepositoryException(
                f"Failed to list tags: {str(e)}",
                details={"user_id": user_id, "error": str(e)},
            )

    async def get_all_tags(self, user_id: str) -> list[Tag]:
        try:
            return await (
                self.model.find({"user_id": user_id})
                .sort("name")
                .to_list()
            )
        except PyMongoError as e:
            logger.error("tag_get_all_failed", error=str(e), user_id=user_id)
            raise RepositoryException(
                f"Failed to get all tags: {str(e)}",
                details={"user_id": user_id, "error": str(e)},
            )

    async def rename_tag(self, user_id: str, old_name: str, new_name: str) -> None:
        if old_name == new_name:
            return
        try:
            tag_doc = await self.model.find_one(
                {"user_id": user_id, "name": old_name}
            )
            if not tag_doc:
                raise ValueError(f"Tag '{old_name}' not found")

            target = await self.model.find_one(
                    {"user_id": user_id, "name": new_name}
            )
            if target:
                target.usage_count += tag_doc.usage_count
                await target.save()
                await tag_doc.delete()
            else:
                tag_doc.name = new_name
                await tag_doc.save()

            await Journal.find(
                {"user_id": user_id, "tags": old_name}
            ).update({"$set": {"tags.$": new_name}})
        except ValueError:
            raise
        except PyMongoError as e:
            logger.error("tag_rename_failed", error=str(e), user_id=user_id)
            raise RepositoryException(
                f"Failed to rename tag: {str(e)}",
                details={"user_id": user_id, "error": str(e)},
            )

    async def update_tag(
        self, user_id: str, name: str, color: Optional[str] = None,
    ) -> Optional[Tag]:
        try:
            tag = await self.model.find_one({"user_id": user_id, "name": name})
            if not tag:
                return None
            if color is not None:
                tag.color = color
            await tag.save()
            return tag
        except PyMongoError as e:
            logger.error("tag_update_failed", error=str(e), user_id=user_id)
            raise RepositoryException(
                f"Failed to update tag: {str(e)}",
                details={"user_id": user_id, "error": str(e)},
            )

    async def delete_tag(self, user_id: str, name: str) -> None:
        try:
            tag_doc = await self.model.find_one(
                {"user_id": user_id, "name": name}
            )
            if tag_doc:
                await tag_doc.delete()

            await Journal.find(
                {"user_id": user_id, "tags": name}
            ).update({"$pull": {"tags": name}})
        except PyMongoError as e:
            logger.error("tag_delete_failed", error=str(e), user_id=user_id)
            raise RepositoryException(
                f"Failed to delete tag: {str(e)}",
                details={"user_id": user_id, "error": str(e)},
            )
