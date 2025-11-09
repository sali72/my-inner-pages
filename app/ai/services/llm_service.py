from openai import OpenAI
from typing import Optional
from app.core.config import Settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class LLMService:
    """
    Service for interacting with LLM providers.
    Currently supports OpenRouter via OpenAI-compatible API.
    """
    
    def __init__(self, settings: Settings):
        self.settings = settings
        self.client = None
    
    def _get_client(self) -> OpenAI:
        """Get or create OpenAI client configured for OpenRouter."""
        if self.client is None:
            if not hasattr(self.settings, 'openrouter_api_key'):
                logger.error("openrouter_api_key_not_configured")
                raise ValueError("OPENROUTER_API_KEY not configured in settings")
            
            api_key = self.settings.openrouter_api_key
            
            if not api_key or api_key == "":
                logger.error("openrouter_api_key_empty")
                raise ValueError("OPENROUTER_API_KEY is empty")
            
            self.client = OpenAI(
                base_url="https://openrouter.ai/api/v1",
                api_key=api_key,
            )
            logger.info("openai_client_created")
        
        return self.client
    
    def _clean_response(self, text: str) -> str:
        """
        Clean up model-specific tokens and artifacts from the response.
        
        Args:
            text: Raw text from the model
            
        Returns:
            Cleaned text
        """
        if not text:
            return text
        
        # List of tokens/patterns to remove
        cleanup_patterns = [
            '<|begin_of_sentence|>',
            '<｜begin▁of▁sentence｜>',
            '<|end_of_sentence|>',
            '<｜end▁of▁sentence｜>',
            '<|im_start|>',
            '<|im_end|>',
            '<|endoftext|>',
            '<<SYS>>',
            '<</SYS>>',
        ]
        
        cleaned = text
        for pattern in cleanup_patterns:
            cleaned = cleaned.replace(pattern, '')
        
        # Remove leading/trailing whitespace
        cleaned = cleaned.strip()
        
        logger.debug("response_cleaned", original_length=len(text), cleaned_length=len(cleaned))
        
        return cleaned
    
    async def generate_completion(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
        max_tokens: int = 500,
        temperature: float = 0.7
    ) -> str:
        """
        Generate a completion from the LLM.
        
        Args:
            prompt: User prompt
            system_prompt: Optional system prompt
            model: Model to use (defaults to config)
            max_tokens: Maximum tokens to generate
            temperature: Temperature for generation
            
        Returns:
            Generated text response
            
        Raises:
            Exception: If API call fails
        """
        logger.info("generate_completion_start", model=model, max_tokens=max_tokens, temperature=temperature)
        
        if not model:
            model = "deepseek/deepseek-chat-v3.1:free"
        
        logger.info("llm_request", model=model, has_system_prompt=bool(system_prompt))
        
        # Build messages
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        try:
            client = self._get_client()
            
            logger.info("sending_request_to_openrouter", model=model)
            
            # Make synchronous call (OpenAI client doesn't support async in this version)
            completion = client.chat.completions.create(
                extra_headers={
                    "HTTP-Referer": self.settings.app_name,
                    "X-Title": self.settings.app_name,
                },
                model=model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature
            )
            
            generated_text = completion.choices[0].message.content
            
            # Clean up model-specific tokens that sometimes leak through
            generated_text = self._clean_response(generated_text)
            
            logger.info("generation_success", text_length=len(generated_text))
            return generated_text
            
        except Exception as e:
            logger.error("llm_api_error", error=str(e), error_type=type(e).__name__)
            raise Exception(f"LLM API error: {str(e)}")
