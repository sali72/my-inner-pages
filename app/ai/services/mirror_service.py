from typing import Optional

from app.ai.config import AIModuleConfig
from app.ai.integrations.openrouter_client import LLMClient
from app.ai.prompts.mirror import create_reflection_prompt, get_output_parser
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
        """
        Generate a daily reflection for the user based on recent journals.

        Args:
            user_id: User ID
            mode: Reflection mode (emotional, cognitive, behavioral, relational)

        Returns:
            Dictionary with reflection data
        """
        logger.info("generate_reflection_start", user_id=user_id, mode=mode)

        if not self.config.enable_mirror:
            logger.error("mirror_feature_disabled")
            raise ValueError("Mirror feature is not enabled")

        # Validate and default mode
        if mode and mode not in self.config.mirror_reflection_modes:
            logger.warning(
                "invalid_mode",
                requested_mode=mode,
                valid_modes=self.config.mirror_reflection_modes,
            )
            mode = None

        if not mode:
            mode = "emotional"  # Default mode
            logger.info("using_default_mode", mode=mode)

        # Get journal context
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

        # Create LangChain prompt template
        prompt_template = create_reflection_prompt(mode, has_journals)

        # Format prompt with context
        if has_journals:
            formatted_messages = prompt_template.format_messages(
                context=context, mode=mode
            )
        else:
            formatted_messages = prompt_template.format_messages(mode=mode)

        logger.info("prompts_formatted", num_messages=len(formatted_messages))

        # Generate reflection
        try:
            logger.info("calling_llm_client", mode=mode)

            # Extract system and user prompts from formatted messages
            system_prompt = (
                formatted_messages[0].content if len(formatted_messages) > 0 else None
            )
            user_prompt = (
                formatted_messages[1].content if len(formatted_messages) > 1 else ""
            )

            reflection_text = await self.llm_client.generate(
                prompt=user_prompt,
                system_prompt=system_prompt,
                max_tokens=400,
                temperature=0.8,
            )

            # Parse output (currently just string, but extensible)
            parser = get_output_parser()
            parsed_reflection = parser.parse(reflection_text)

            logger.info(
                "reflection_generated_successfully",
                reflection_length=len(parsed_reflection),
            )

            return {
                "reflection": parsed_reflection,
                "mode": mode,
                "available_modes": self.config.mirror_reflection_modes,
            }
        except Exception as e:
            # Return a graceful fallback if LLM fails
            logger.error(
                "reflection_generation_failed",
                error=str(e),
                error_type=type(e).__name__,
            )
            return {
                "reflection": "Take a moment to reflect on your recent thoughts. What patterns do you notice?",
                "mode": mode,
                "available_modes": self.config.mirror_reflection_modes,
                "error": str(e),
            }
