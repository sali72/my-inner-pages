import re
from typing import Optional
from beanie.operators import In
from pymongo.errors import PyMongoError

from app.journals.db.tag_model import Tag
from app.journals.db.models import Journal
from app.core.exceptions import RepositoryException
from app.core.logging import get_logger


from app.journals.utils.tiptap_parser import (
    replace_hashtag_in_text,
    replace_hashtag_in_tiptap_json,
    extract_text_from_tiptap_json,
)


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
        old_norm = old_name.strip().lower()
        new_norm = new_name.strip().lower()
        if not old_norm or not new_norm:
            raise ValueError("Tag names cannot be empty")
        if old_norm == new_norm:
            return

        try:
            tag_doc = await self.model.find_one(
                {"user_id": user_id, "name": old_norm}
            )
            if not tag_doc:
                raise ValueError(f"Tag '{old_name}' not found")

            target = await self.model.find_one(
                {"user_id": user_id, "name": new_norm}
            )
            if target:
                target.usage_count += tag_doc.usage_count
                if tag_doc.color and not target.color:
                    target.color = tag_doc.color
                await target.save()
                await tag_doc.delete()
            else:
                tag_doc.name = new_norm
                await tag_doc.save()

            escaped_old = re.escape(old_norm)
            journals = await Journal.find({
                "user_id": user_id,
                "$or": [
                    {"tags": old_norm},
                    {"content_text": {"$regex": rf"#{escaped_old}\b", "$options": "i"}},
                ]
            }).to_list()

            for j in journals:
                updated = False
                if old_norm in j.tags:
                    new_tags = [new_norm if t == old_norm else t for t in j.tags]
                    j.tags = list(dict.fromkeys(new_tags))
                    updated = True

                if j.content_json and re.search(rf"#{escaped_old}\b", extract_text_from_tiptap_json(j.content_json), re.IGNORECASE):
                    j.content_json = replace_hashtag_in_tiptap_json(j.content_json, old_norm, new_norm)
                    j.content_text = extract_text_from_tiptap_json(j.content_json)
                    updated = True
                elif j.content_text and re.search(rf"#{escaped_old}\b", j.content_text, re.IGNORECASE):
                    j.content_text = replace_hashtag_in_text(j.content_text, old_norm, new_norm)
                    updated = True

                if updated:
                    await j.save()

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
            normalized = name.strip().lower()
            tag = await self.model.find_one({"user_id": user_id, "name": normalized})
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
        norm = name.strip().lower()
        if not norm:
            return
        try:
            tag_doc = await self.model.find_one(
                {"user_id": user_id, "name": norm}
            )
            if tag_doc:
                await tag_doc.delete()

            escaped_name = re.escape(norm)
            journals = await Journal.find({
                "user_id": user_id,
                "$or": [
                    {"tags": norm},
                    {"content_text": {"$regex": rf"#{escaped_name}\b", "$options": "i"}},
                ]
            }).to_list()

            for j in journals:
                updated = False
                if norm in j.tags:
                    j.tags = [t for t in j.tags if t != norm]
                    updated = True

                if j.content_json and re.search(rf"#{escaped_name}\b", extract_text_from_tiptap_json(j.content_json), re.IGNORECASE):
                    j.content_json = replace_hashtag_in_tiptap_json(j.content_json, norm, None)
                    j.content_text = extract_text_from_tiptap_json(j.content_json)
                    updated = True
                elif j.content_text and re.search(rf"#{escaped_name}\b", j.content_text, re.IGNORECASE):
                    j.content_text = replace_hashtag_in_text(j.content_text, norm, None)
                    updated = True

                if updated:
                    await j.save()

        except PyMongoError as e:
            logger.error("tag_delete_failed", error=str(e), user_id=user_id)
            raise RepositoryException(
                f"Failed to delete tag: {str(e)}",
                details={"user_id": user_id, "error": str(e)},
            )

