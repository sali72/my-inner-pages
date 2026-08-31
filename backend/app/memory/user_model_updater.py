from datetime import datetime, timezone
import json
import re
import difflib
from typing import Optional

from app.ai.integrations.base import LLMClient
from app.core.logging import get_logger
from app.journals.db.models import Journal
from app.journals.db.repository import JournalRepository
from app.memory.config import MemoryModuleConfig
from app.memory.db.models import UserModel, UserModelStats, PatternItem, PatternExcerpt
from app.memory.db.repository import UserModelRepository
from app.memory.prompts.update_prompt import (
    USER_MODEL_UPDATE_SYSTEM_PROMPT,
    USER_MODEL_UPDATE_PROMPT,
)

logger = get_logger(__name__)


def normalize_for_matching(text: str) -> str:
    if not text:
        return ""
    cleaned = re.sub(r'[^\w\s]', ' ', text.lower())
    return re.sub(r'\s+', ' ', cleaned).strip()


def verify_quote_in_text(quote: str, source_text: str, min_similarity: float = 0.8) -> bool:
    norm_quote = normalize_for_matching(quote)
    norm_source = normalize_for_matching(source_text)
    if not norm_quote or not norm_source:
        return False
    if norm_quote in norm_source:
        return True
    words_quote = norm_quote.split()
    words_source = norm_source.split()
    len_quote = len(words_quote)
    if len_quote == 0 or len_quote > len(words_source):
        return False
    for i in range(max(1, len(words_source) - len_quote + 1)):
        window = " ".join(words_source[i : i + len_quote])
        ratio = difflib.SequenceMatcher(None, norm_quote, window).ratio()
        if ratio >= min_similarity:
            return True
    return False


async def trigger_update_if_needed(updater: "UserModelUpdater", user_id: str) -> None:
    try:
        if await updater.needs_update(user_id):
            logger.info("background_update_triggered", user_id=user_id)
            await updater.update(user_id)
    except Exception as e:
        logger.error(
            "background_update_failed",
            user_id=user_id,
            error=str(e),
            error_type=type(e).__name__,
        )



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

    def _check_valence_gate(self, journals: list[Journal]) -> bool:
        """
        Returns True if the current window is safe for normal pattern updating.
        Returns False if mean rumination index >= 0.70 (acute distress / trauma window).
        """
        indices = [j.rumination_index for j in journals if j.rumination_index is not None]
        if not indices:
            return True
        mean_rumin = sum(indices) / len(indices)
        if mean_rumin >= 0.70:
            logger.warning("valence_gate_triggered_suppressing_patterns", mean_rumination=mean_rumin)
            return False
        return True

    async def update(self, user_id: str) -> UserModel:
        logger.info("user_model_update_started", user_id=user_id)

        user_model = await self.user_model_repository.find_by_user_id(user_id)
        if user_model is None:
            user_model = UserModel(user_id=user_id)
            logger.info("user_model_created_new", user_id=user_id)

        journals, _ = await self.journal_repository.find_all_by_user(
            user_id=user_id,
            limit=self.config.max_journals_for_updater,
        )

        is_valence_safe = self._check_valence_gate(journals)

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

            updated = self._parse_and_merge(user_model, response, journals, is_valence_safe=is_valence_safe)
            updated.version += 1
            updated.updatedAt = datetime.now(timezone.utc)
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
        journals, _ = await self.journal_repository.find_all_by_user(
            user_id=user_id,
            limit=10000,
        )
        return sum(len((j.content_text or "").split()) for j in journals)

    def _format_journals_for_prompt(self, journals: list[Journal]) -> str:
        parts = []
        for j in journals:
            date_str = j.created_at.strftime("%Y-%m-%d") if j.created_at else "unknown"
            entry_id_str = str(j.id)
            parts.append(
                f"[ID: {entry_id_str}] [{date_str}] {j.title}\n"
                f"Tags: {', '.join(j.tags) if j.tags else 'none'}\n"
                f"{j.content_text}\n"
            )
        return "\n---\n".join(parts)

    def _verify_and_filter_patterns(
        self,
        raw_patterns: list[dict],
        journals_map: dict[str, Journal],
    ) -> list[PatternItem]:
        verified_patterns: list[PatternItem] = []
        for item in raw_patterns:
            if not isinstance(item, dict):
                continue
            desc = item.get("description", "")
            evidence = item.get("evidence", "")
            raw_excerpts = item.get("source_excerpts", [])

            verified_excerpts: list[PatternExcerpt] = []
            if isinstance(raw_excerpts, list):
                for exc in raw_excerpts:
                    if not isinstance(exc, dict):
                        continue
                    entry_id = str(exc.get("entry_id", "")).strip()
                    quote = str(exc.get("quote", "")).strip()
                    if not entry_id or not quote:
                        continue
                    journal = journals_map.get(entry_id)
                    if journal and verify_quote_in_text(quote, journal.content_text):
                        entry_date = journal.created_at.strftime("%Y-%m-%d") if journal.created_at else None
                        verified_excerpts.append(
                            PatternExcerpt(
                                entry_id=entry_id,
                                quote=quote,
                                entry_date=entry_date,
                            )
                        )
                    else:
                        logger.info("quote_verification_dropped_excerpt", entry_id=entry_id, quote_preview=quote[:50])

            if verified_excerpts:
                verified_patterns.append(
                    PatternItem(
                        description=desc,
                        evidence=evidence,
                        source_excerpts=verified_excerpts,
                    )
                )
            else:
                logger.info("pattern_dropped_due_to_unverified_excerpts", pattern_description=desc[:60])
        return verified_patterns


    def _parse_and_merge(
        self,
        existing: UserModel,
        llm_response: str,
        journals: list[Journal],
        is_valence_safe: bool = True,
    ) -> UserModel:
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

        if "baseline" in data and isinstance(data["baseline"], dict):
            existing.baseline.emotionalTone = data["baseline"].get("emotionalTone", existing.baseline.emotionalTone)
            existing.baseline.thinkingStyle = data["baseline"].get("thinkingStyle", existing.baseline.thinkingStyle)
            existing.baseline.selfFocus = data["baseline"].get("selfFocus", existing.baseline.selfFocus)
            if "confidence" in data["baseline"]:
                try:
                    existing.baseline.confidence = float(data["baseline"]["confidence"])
                except (ValueError, TypeError):
                    pass

        journals_map = {str(j.id): j for j in journals}

        if is_valence_safe and "patterns" in data and isinstance(data["patterns"], list):
            existing.patterns = self._verify_and_filter_patterns(data["patterns"], journals_map)
        elif not is_valence_safe:
            logger.info("valence_gate_active_preserved_existing_patterns", user_id=existing.user_id)

        if "activeThemes" in data and isinstance(data["activeThemes"], list):
            existing.activeThemes = [str(t) for t in data["activeThemes"] if t]

        if "conversationGuidelines" in data:
            raw = data["conversationGuidelines"]
            if isinstance(raw, str):
                raw = [raw]
            if isinstance(raw, list):
                existing.conversationGuidelines = [str(g) for g in raw if g]

        return existing
