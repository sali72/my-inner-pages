from typing import Optional, Dict, Any
from datetime import datetime
from beanie import PydanticObjectId

from app.ai.rumination import compute_rumination_index
from app.journals.db.models import Journal
from app.journals.db.repository import JournalRepository
from app.journals.db.tag_repository import TagRepository
from app.journals.config import JournalModuleConfig
from app.journals.utils.tiptap_parser import extract_text_from_tiptap_json


class JournalFacade:
    """
    Facade for journal business logic and orchestration.
    Coordinates between repository and applies business rules.
    """

    def __init__(
        self,
        repository: JournalRepository,
        tag_repository: TagRepository,
        config: JournalModuleConfig,
    ):
        self.repository = repository
        self.tag_repository = tag_repository
        self.config = config

    async def create_journal(
        self,
        user_id: str,
        title: Optional[str],
        content_json: Dict[str, Any],
        tags: Optional[list[str]] = None,
        created_at: Optional[datetime] = None,
    ) -> Journal:
        if title is not None:
            self._validate_title(title)

        content_text = extract_text_from_tiptap_json(content_json)
        self._validate_content(content_text)

        normalized_tags = self._normalize_tags(tags or [])
        rumination_index = compute_rumination_index(content_text)

        journal = await self.repository.create(
            user_id=user_id,
            title=title.strip() if title else title,
            content_json=content_json,
            content_text=content_text,
            tags=normalized_tags,
            rumination_index=rumination_index,
            created_at=created_at,
        )

        if normalized_tags:
            await self.tag_repository.upsert_tags(user_id, normalized_tags)

        return journal

    async def get_journal(self, journal_id: str, user_id: str) -> Optional[Journal]:
        from app.core.validators import validate_object_id

        obj_id = validate_object_id(journal_id, "journal_id")
        return await self.repository.find_by_id(obj_id, user_id)

    async def list_journals(
        self,
        user_id: str,
        cursor: Optional[str] = None,
        page_size: int = 20,
        tags: Optional[list[str]] = None,
        tag_mode: str = "or",
    ) -> tuple[list[Journal], Optional[str]]:
        page_size = min(page_size, self.config.max_page_size)
        page_size = max(1, page_size)

        journals, next_cursor = await self.repository.find_all_by_user(
            user_id, cursor=cursor, limit=page_size, tags=tags, tag_mode=tag_mode
        )

        return journals, next_cursor

    async def update_journal(
        self,
        journal_id: str,
        user_id: str,
        title: Optional[str] = None,
        content_json: Optional[Dict[str, Any]] = None,
        tags: Optional[list[str]] = None,
        created_at: Optional[datetime] = None,
    ) -> Optional[Journal]:
        from app.core.validators import validate_object_id

        obj_id = validate_object_id(journal_id, "journal_id")

        if title is not None:
            self._validate_title(title)
            title = title.strip()

        content_text: Optional[str] = None
        rumination_index: Optional[float] = None

        if content_json is not None:
            content_text = extract_text_from_tiptap_json(content_json)
            self._validate_content(content_text)
            rumination_index = compute_rumination_index(content_text)

        old_tags: list[str] = []
        if tags is not None:
            tags = self._normalize_tags(tags)
            existing = await self.repository.find_by_id(obj_id, user_id)
            if existing:
                old_tags = list(existing.tags)

        journal = await self.repository.update(
            journal_id=obj_id,
            user_id=user_id,
            title=title,
            content_json=content_json,
            content_text=content_text,
            tags=tags,
            rumination_index=rumination_index,
            created_at=created_at,
        )

        if tags is not None and journal is not None:
            await self.tag_repository.replace_tags(user_id, old_tags, tags)

        return journal

    async def delete_journal(self, journal_id: str, user_id: str) -> bool:
        from app.core.validators import validate_object_id

        obj_id = validate_object_id(journal_id, "journal_id")

        journal = await self.repository.find_by_id(obj_id, user_id)
        if not journal:
            return await self.repository.delete(obj_id, user_id)

        tags_to_remove = list(journal.tags)
        deleted = await self.repository.delete(obj_id, user_id)
        if deleted and tags_to_remove:
            await self.tag_repository.remove_tags(user_id, tags_to_remove)
        return deleted

    def _validate_title(self, title: str) -> None:
        if len(title) > self.config.max_title_length:
            raise ValueError(f"Title cannot exceed {self.config.max_title_length} characters")

    def _validate_content(self, content: str) -> None:
        if len(content) > self.config.max_content_length:
            raise ValueError(f"Content cannot exceed {self.config.max_content_length} characters")

    def _validate_tag_names(self, tags: list[str]) -> None:
        if len(tags) > self.config.max_tags_per_journal:
            raise ValueError(
                f"Maximum {self.config.max_tags_per_journal} tags allowed per journal"
            )
        import re
        for tag in tags:
            if len(tag) > self.config.max_tag_length:
                raise ValueError(
                    f"Tag '{tag[:20]}...' exceeds maximum length of {self.config.max_tag_length} characters"
                )
            if not re.match(r'^[\w\s-]+$', tag):
                raise ValueError(
                    f"Tag '{tag}' contains invalid characters. Only letters, numbers, spaces, underscores, and hyphens are allowed."
                )

    def _normalize_tags(self, tags: list[str]) -> list[str]:
        if not self.config.enable_tags:
            return []

        normalized = [tag.strip().lower() for tag in tags]
        normalized = [tag for tag in normalized if tag]
        deduped = list(dict.fromkeys(normalized))

        self._validate_tag_names(deduped)
        return deduped
