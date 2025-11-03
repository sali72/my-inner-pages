from typing import Optional
from app.ai.services.llm_service import LLMService
from app.memory.service import MemoryService
from app.ai.config import AIModuleConfig


class MirrorService:
    """
    Service for generating mirror reflections - daily insights based on user's journals.
    """
    
    def __init__(
        self,
        llm_service: Optional[LLMService] = None,
        memory_service: Optional[MemoryService] = None
    ):
        self.llm_service = llm_service or LLMService()
        self.memory_service = memory_service or MemoryService()
        self.config = AIModuleConfig()
    
    async def generate_reflection(
        self,
        user_id: str,
        mode: Optional[str] = None
    ) -> dict:
        """
        Generate a daily reflection for the user based on recent journals.
        
        Args:
            user_id: User ID
            mode: Reflection mode (emotional, cognitive, behavioral, relational)
            
        Returns:
            Dictionary with reflection data
        """
        if not self.config.enable_mirror:
            raise ValueError("Mirror feature is not enabled")
        
        # Validate and default mode
        if mode and mode not in self.config.mirror_reflection_modes:
            mode = None
        
        if not mode:
            mode = "emotional"  # Default mode
        
        # Get journal context
        context = await self.memory_service.build_journal_context(
            user_id=user_id,
            limit=self.config.max_journals_for_mirror
        )
        
        # Build prompts based on mode
        system_prompt = self._get_system_prompt(mode)
        user_prompt = self._build_user_prompt(context, mode)
        
        # Generate reflection
        try:
            reflection_text = await self.llm_service.generate_completion(
                prompt=user_prompt,
                system_prompt=system_prompt,
                max_tokens=400,
                temperature=0.8
            )
            
            return {
                "reflection": reflection_text,
                "mode": mode,
                "available_modes": self.config.mirror_reflection_modes
            }
        except Exception as e:
            # Return a graceful fallback if LLM fails
            return {
                "reflection": "Take a moment to reflect on your recent thoughts. What patterns do you notice?",
                "mode": mode,
                "available_modes": self.config.mirror_reflection_modes,
                "error": str(e)
            }
    
    def _get_system_prompt(self, mode: str) -> str:
        """Get system prompt based on reflection mode."""
        prompts = {
            "emotional": (
                "You are a compassionate reflection companion for a journaling app. "
                "Your role is to provide brief, emotionally aware insights based on the user's recent journal entries. "
                "Focus on emotional patterns, feelings, and inner experiences. "
                "Be warm, empathetic, and encouraging. Keep responses under 100 words. "
                "Avoid being prescriptive or giving direct advice. Instead, reflect back what you notice."
            ),
            "cognitive": (
                "You are a thoughtful reflection companion for a journaling app. "
                "Your role is to provide brief insights about thinking patterns, beliefs, and perspectives "
                "based on the user's recent journal entries. "
                "Focus on cognitive patterns, assumptions, and ways of thinking. "
                "Be curious and thought-provoking. Keep responses under 100 words. "
                "Help the user see their thoughts from a new angle."
            ),
            "behavioral": (
                "You are an observant reflection companion for a journaling app. "
                "Your role is to provide brief insights about actions, habits, and behaviors "
                "based on the user's recent journal entries. "
                "Focus on patterns in what the user does and how they respond to situations. "
                "Be supportive and non-judgmental. Keep responses under 100 words. "
                "Help the user notice their behavioral patterns."
            ),
            "relational": (
                "You are an empathetic reflection companion for a journaling app. "
                "Your role is to provide brief insights about relationships and connections "
                "based on the user's recent journal entries. "
                "Focus on interpersonal patterns, social experiences, and relationships. "
                "Be understanding and relationship-focused. Keep responses under 100 words. "
                "Help the user understand their relational patterns."
            )
        }
        return prompts.get(mode, prompts["emotional"])
    
    def _build_user_prompt(self, context: str, mode: str) -> str:
        """Build user prompt with journal context."""
        if context == "No journal entries available yet.":
            return (
                "The user hasn't written any journal entries yet. "
                f"Provide a gentle, welcoming {mode} reflection that encourages them to start journaling "
                "and explains how this mirror will help them understand themselves better."
            )
        
        return (
            f"Here are the user's recent journal entries:\n\n{context}\n\n"
            f"Based on these entries, provide a brief {mode} reflection. "
            "Focus on patterns you notice and insights that might help them understand themselves better. "
            "Be warm, compassionate, and encouraging. Keep it personal and specific to their writing."
        )
