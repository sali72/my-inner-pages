from abc import ABC, abstractmethod
from typing import Optional
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from app.core.logging import get_logger

logger = get_logger(__name__)


class LLMClient(ABC):
    """Abstract base class for LLM clients."""
    
    @abstractmethod
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 500,
        temperature: float = 0.7
    ) -> str:
        """Generate completion from LLM."""
        pass


class OpenRouterClient(LLMClient):
    """OpenRouter LLM client with automatic model fallback support."""
    
    def __init__(
        self,
        api_key: str,
        model: str,
        fallback_models: list[str],
        base_url: str,
        max_tokens: int = 500,
        temperature: float = 0.7,
        app_name: str = "my-inner-pages"
    ):
        """
        Initialize OpenRouter client with fallback chain.
        
        Args:
            api_key: OpenRouter API key
            model: Primary model identifier
            fallback_models: List of fallback models (tried in order)
            base_url: OpenRouter base URL
            max_tokens: Default max tokens
            temperature: Default temperature
            app_name: App name for headers
        """
        if not api_key:
            logger.error("api_key_empty")
            raise ValueError("API key is required")
        
        self.api_key = api_key
        self.base_url = base_url
        self.app_name = app_name
        self.model = model
        self.fallback_models = fallback_models
        self.default_max_tokens = max_tokens
        self.default_temperature = temperature
        
        self._llm = self._create_llm_chain(max_tokens, temperature)
        
        logger.info("openrouter_client_created", model=model, fallback_count=len(fallback_models))
    
    def _create_llm_chain(self, max_tokens: int, temperature: float):
        """Create LLM with fallback chain."""
        extra_headers = {
            "HTTP-Referer": self.app_name,
            "X-Title": self.app_name,
        }
        
        # Create primary LLM
        primary = ChatOpenAI(
            model=self.model,
            openai_api_base=self.base_url,
            openai_api_key=self.api_key,
            max_tokens=max_tokens,
            temperature=temperature,
            model_kwargs={"extra_headers": extra_headers}
        )
        
        # Create fallback chain
        if self.fallback_models:
            fallbacks = [
                ChatOpenAI(
                    model=m,
                    openai_api_base=self.base_url,
                    openai_api_key=self.api_key,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    model_kwargs={"extra_headers": extra_headers}
                )
                for m in self.fallback_models
            ]
            return primary.with_fallbacks(fallbacks)
        
        return primary
    
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 500,
        temperature: float = 0.7
    ) -> str:
        """
        Generate completion using OpenRouter with automatic fallback.
        
        Args:
            prompt: User prompt
            system_prompt: Optional system prompt
            max_tokens: Maximum tokens to generate
            temperature: Temperature for generation
            
        Returns:
            Generated text response
        """
        logger.info("generate_start", max_tokens=max_tokens, temperature=temperature)
        
        try:
            # Recreate chain if parameters changed
            if max_tokens != self.default_max_tokens or temperature != self.default_temperature:
                llm = self._create_llm_chain(max_tokens, temperature)
            else:
                llm = self._llm
            
            # Build messages
            messages = []
            if system_prompt:
                messages.append(SystemMessage(content=system_prompt))
            messages.append(HumanMessage(content=prompt))
            
            logger.info("sending_request_to_openrouter", has_system_prompt=bool(system_prompt))
            
            # LangChain handles fallback automatically
            response = await llm.ainvoke(messages)
            generated_text = response.content
            
            logger.info("generation_success", text_length=len(generated_text))
            return generated_text
            
        except Exception as e:
            logger.error("openrouter_api_error", error=str(e), error_type=type(e).__name__)
            raise Exception(f"OpenRouter API error: {str(e)}")
