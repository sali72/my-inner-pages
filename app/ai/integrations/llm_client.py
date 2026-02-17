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


class LangChainLLMClient(LLMClient):
    """LangChain-based LLM client with configurable settings."""
    
    def __init__(
        self,
        api_key: str,
        model: str,
        base_url: str,
        max_tokens: int = 500,
        temperature: float = 0.7,
        app_name: str = "my-inner-pages"
    ):
        """
        Initialize LangChain LLM client.
        
        Args:
            api_key: API key for the LLM provider
            model: Model identifier
            base_url: Base URL for the LLM API
            max_tokens: Default max tokens
            temperature: Default temperature
            app_name: App name for headers
        """
        if not api_key:
            logger.error("api_key_empty")
            raise ValueError("API key is required")
        
        self._llm = ChatOpenAI(
            model=model,
            openai_api_base=base_url,
            openai_api_key=api_key,
            max_tokens=max_tokens,
            temperature=temperature,
            model_kwargs={
                "extra_headers": {
                    "HTTP-Referer": app_name,
                    "X-Title": app_name,
                }
            }
        )
        logger.info("langchain_llm_client_created", model=model, base_url=base_url)
    
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 500,
        temperature: float = 0.7
    ) -> str:
        """
        Generate completion using LangChain.
        
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
            # Update parameters if different from defaults
            self._llm.max_tokens = max_tokens
            self._llm.temperature = temperature
            
            # Build messages
            messages = []
            if system_prompt:
                messages.append(SystemMessage(content=system_prompt))
            messages.append(HumanMessage(content=prompt))
            
            logger.info("sending_request_to_llm", has_system_prompt=bool(system_prompt))
            
            # Invoke LLM
            response = await self._llm.ainvoke(messages)
            generated_text = response.content
            
            logger.info("generation_success", text_length=len(generated_text))
            return generated_text
            
        except Exception as e:
            logger.error("llm_api_error", error=str(e), error_type=type(e).__name__)
            raise Exception(f"LLM API error: {str(e)}")
