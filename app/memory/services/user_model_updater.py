from datetime import datetime

from app.ai.integrations.openrouter_client import LLMClient
from app.core.logging import get_logger
from app.journals.db.models import Journal
from app.journals.db.repository import JournalRepository
from app.memory.config import MemoryModuleConfig
from app.memory.db.models import UserModel, UserModelStats
from app.memory.db.repository import UserModelRepository
from app.memory.prompts.update_prompt import (
    USER_MODEL_UPDATE_SYSTEM_PROMPT,
    USER_MODEL_UPDATE_PROMPT,
)

logger = get_logger(__name__)


async def trigger_update_if_needed(updater: "UserModelUpdater", user_id: str) -> None:
    try:
        if await updater.needs_update(user_id):
            logger.info("background_update_triggered", user_id=user_id)
            await updater.update(user_id)
    except Exception:
        logger.exception("background_update_failed", user_id=user_id)


class UserModelUpdater:
    def __init__(
        self,
        user_model_repository: UserModelRepository,
        journal_repository: JournalRepository,
        llm_client: LLMClient,
        config: MemoryModuleConfig,
    ):
        self.user_model_repository = user_model_repository
        self.journal_repository = journal_repository
        self.llm_client = llm_client
        self.config = config

    async def needs_update(self, user_id: str) -> bool:
        total_journals = await self.journal_repository.count_by_user(user_id)
        if total_journals < self.config.min_entries_for_update:
            return False

        user_model = await self.user_model_repository.find_by_user_id(user_id)
        if user_model is None:
            return True

        if user_model.stats is None:
            return True

        new_entries = total_journals - user_model.stats.lastUpdatedEntryCount
        if new_entries >= self.config.update_after_entries:
            logger.info("user_model_update_needed_by_entries", user_id=user_id, new_entries=new_entries)
            return True

        total_words = await self._count_total_words(user_id)
        new_words = total_words - (user_model.stats.totalWords or 0)
        if new_words >= self.config.update_after_words:
            logger.info("user_model_update_needed_by_words", user_id=user_id, new_words=new_words)
            return True

        return False

    async def update(self, user_id: str) -> UserModel:
        logger.info("user_model_update_started", user_id=user_id)

        user_model = await self.user_model_repository.find_by_user_id(user_id)
        if user_model is None:
            user_model = UserModel(user_id=user_id)
            logger.info("user_model_created_new", user_id=user_id)

        journals = await self.journal_repository.find_all_by_user(
            user_id=user_id,
            skip=0,
            limit=self.config.max_journals_for_updater,
        )

        journal_text = self._format_journals_for_prompt(journals)
        current_model_json = user_model.model_dump_json(indent=2)

        prompt = USER_MODEL_UPDATE_PROMPT.format(
            current_model=current_model_json,
            journal_entries=journal_text,
        )

        logger.info("user_model_calling_llm", user_id=user_id, journal_count=len(journals))

        try:
            response = await self.llm_client.generate(
                prompt=prompt,
                system_prompt=USER_MODEL_UPDATE_SYSTEM_PROMPT,
                max_tokens=self.config.updater_max_tokens,
                temperature=self.config.updater_temperature,
            )

            updated = self._parse_and_merge(user_model, response)
            updated.version += 1
            updated.updatedAt = datetime.utcnow()
            updated.stats.totalEntries = await self.journal_repository.count_by_user(user_id)
            updated.stats.totalWords = await self._count_total_words(user_id)
            updated.stats.lastUpdatedEntryCount = updated.stats.totalEntries

            await self.user_model_repository.upsert(updated)
            logger.info("user_model_updated_successfully", user_id=user_id)
            return updated

        except Exception as e:
            logger.error(
                "user_model_update_failed",
                user_id=user_id,
                error=str(e),
                error_type=type(e).__name__,
            )
            raise

    async def _count_total_words(self, user_id: str) -> int:
        journals = await self.journal_repository.find_all_by_user(
            user_id=user_id,
            skip=0,
            limit=10000,
        )
        return sum(len(j.content.split()) for j in journals)

    def _format_journals_for_prompt(self, journals: list[Journal]) -> str:
        parts = []
        for j in journals:
            date_str = j.created_at.strftime("%Y-%m-%d") if j.created_at else "unknown"
            parts.append(
                f"[{date_str}] {j.title}\n"
                f"Tags: {', '.join(j.tags) if j.tags else 'none'}\n"
                f"{j.content}\n"
            )
        return "\n---\n".join(parts)

    def _parse_and_merge(self, existing: UserModel, llm_response: str) -> UserModel:
        import json

        llm_response = llm_response.strip()
        if llm_response.startswith("```json"):
            llm_response = llm_response[7:]
        if llm_response.endswith("```"):
            llm_response = llm_response[:-3]
        llm_response = llm_response.strip()

        try:
            data = json.loads(llm_response)
        except json.JSONDecodeError as e:
            logger.error("user_model_parse_failed", error=str(e), response_preview=llm_response[:200])
            raise ValueError(f"LLM returned invalid JSON: {e}")

        if "baseline" in data:
            existing.baseline.emotionalTone = data["baseline"].get("emotionalTone", existing.baseline.emotionalTone)
            existing.baseline.thinkingStyle = data["baseline"].get("thinkingStyle", existing.baseline.thinkingStyle)
            existing.baseline.selfFocus = data["baseline"].get("selfFocus", existing.baseline.selfFocus)
            if "confidence" in data["baseline"]:
                existing.baseline.confidence = float(data["baseline"]["confidence"])

        if "patterns" in data:
            existing.patterns = data["patterns"]

        if "activeThemes" in data:
            existing.activeThemes = data["activeThemes"]

        if "conversationGuidelines" in data:
            existing.conversationGuidelines = data["conversationGuidelines"]

        return existing
