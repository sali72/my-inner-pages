from collections.abc import AsyncGenerator
from typing import Optional

from app.ai.integrations.openrouter_client import LLMClient
from app.core.logging import get_logger

logger = get_logger(__name__)


class MockLLMClient(LLMClient):
    """Mock LLM client for testing without API calls."""
    
    def __init__(self):
        logger.info("mock_llm_client_initialized")
    
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 500,
        temperature: float = 0.7
    ) -> str:
        """Generate mock completion."""
        logger.info("mock_generate", has_system_prompt=bool(system_prompt))
        
        # Determine mode from system prompt
        mode = self._detect_mode(system_prompt or "")
        
        # Check if user has no journals
        has_no_journals = "hasn't written any journal entries yet" in prompt or "No journal entries available" in prompt
        
        if has_no_journals:
            response = self._get_welcome_reflection(mode)
        else:
            response = self._get_mode_reflection(mode)
        
        logger.info("mock_completion_generated", response_length=len(response), mode=mode)
        return response
    
    def _detect_mode(self, system_prompt: str) -> str:
        """Detect reflection mode from system prompt."""
        prompt_lower = system_prompt.lower()
        if "cognitive" in prompt_lower:
            return "cognitive"
        elif "behavioral" in prompt_lower:
            return "behavioral"
        elif "relational" in prompt_lower:
            return "relational"
        return "emotional"
    
    def _get_welcome_reflection(self, mode: str) -> str:
        """Get welcome reflection for users without journals."""
        reflections = {
            "emotional": (
                "Welcome to your reflection space! This is where you'll discover patterns in your "
                "emotional landscape. As you write, I'll help you notice recurring feelings, "
                "emotional shifts, and the deeper currents beneath your daily experiences."
            ),
            "cognitive": (
                "Welcome to your thinking space! As you journal, I'll help you observe patterns in "
                "your thoughts, beliefs, and perspectives. You'll gain insight into how you make "
                "sense of the world and the assumptions that shape your understanding."
            ),
            "behavioral": (
                "Welcome to your action space! Through your journal entries, I'll help you notice "
                "patterns in your behaviors, habits, and responses to different situations. "
                "Understanding what you do is the first step to intentional change."
            ),
            "relational": (
                "Welcome to your connection space! As you write about your experiences, I'll help "
                "you see patterns in your relationships and social interactions. Understanding how "
                "you relate to others can deepen all your connections."
            )
        }
        return reflections.get(mode, reflections["emotional"])
    
    async def generate_stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 500,
        temperature: float = 0.7,
    ) -> AsyncGenerator[str, None]:
        response = await self.generate(prompt, system_prompt, max_tokens, temperature)
        yield response

    def _get_mode_reflection(self, mode: str) -> str:
        """Get reflection based on mode for users with journals."""
        reflections = {
            "emotional": (
                "I notice a theme of growth and self-awareness in your recent entries. You're "
                "becoming more attuned to your emotional responses and what triggers them. "
                "This awareness is the foundation of emotional intelligence. Keep exploring "
                "these feelings with curiosity and compassion."
            ),
            "cognitive": (
                "Your recent entries reveal interesting thought patterns. You're questioning "
                "assumptions and exploring different perspectives on familiar situations. This "
                "cognitive flexibility is valuable - it allows you to see beyond initial reactions "
                "and consider multiple viewpoints. Notice how this shifts your understanding."
            ),
            "behavioral": (
                "Looking at your recent entries, I see patterns in how you respond to challenges. "
                "You're taking action despite uncertainty, which shows resilience. Pay attention "
                "to which behaviors serve you well and which you might want to adjust. Small "
                "consistent actions create lasting change."
            ),
            "relational": (
                "Your recent writings show you're paying attention to the quality of your "
                "connections. You're noticing how different relationships affect you and what "
                "makes interactions meaningful. This awareness helps you invest energy in "
                "relationships that truly matter. Consider what patterns you see emerging."
            )
        }
        return reflections.get(mode, reflections["emotional"])
