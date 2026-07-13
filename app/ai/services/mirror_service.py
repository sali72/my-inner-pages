from typing import Optional

from app.ai.config import AIModuleConfig
from app.ai.integrations.base import LLMClient
from app.ai.prompts.mirror import create_reflection_prompt
from app.core.logging import get_logger
from app.memory.service import MemoryService

logger = get_logger(__name__)


class MirrorService:
    """
    Service for generating mirror reflections - daily insights based on user's journals.
    """

    def __init__(
        self,
        llm_client: LLMClient,
        memory_service: MemoryService,
        config: AIModuleConfig,
    ):
        self.llm_client = llm_client
        self.memory_service = memory_service
        self.config = config

    async def generate_reflection(
        self, user_id: str, mode: Optional[str] = None
    ) -> dict:
        logger.info("generate_reflection_start", user_id=user_id, mode=mode)

        if not self.config.enable_mirror:
            logger.error("mirror_feature_disabled")
            raise ValueError("Mirror feature is not enabled")

        if mode and mode not in self.config.mirror_reflection_modes:
            logger.warning(
                "invalid_mode",
                requested_mode=mode,
                valid_modes=self.config.mirror_reflection_modes,
            )
            mode = None

        if not mode:
            mode = "emotional"
            logger.info("using_default_mode", mode=mode)

        logger.info(
            "fetching_journal_context",
            user_id=user_id,
            limit=self.config.max_journals_for_mirror,
        )
        context = await self.memory_service.build_journal_context(
            user_id=user_id, limit=self.config.max_journals_for_mirror
        )

        has_journals = "No journal entries available yet." not in context
        logger.info(
            "journal_context_retrieved",
            context_length=len(context),
            has_journals=has_journals,
        )

        system_prompt, user_template = create_reflection_prompt(mode, has_journals)

        if has_journals:
            user_prompt = user_template.format(context=context, mode=mode)
        else:
            user_prompt = user_template.format(mode=mode)

        logger.info("prompts_formatted")

        logger.info("calling_llm_client", mode=mode)

        reflection_text = await self.llm_client.generate(
            prompt=user_prompt,
            system_prompt=system_prompt,
            max_tokens=400,
            temperature=0.8,
        )

        logger.info(
            "reflection_generated_successfully",
            reflection_length=len(reflection_text),
        )

        return {
            "reflection": reflection_text,
            "mode": mode,
            "available_modes": self.config.mirror_reflection_modes,
        }
