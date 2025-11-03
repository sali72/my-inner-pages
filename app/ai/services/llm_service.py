import httpx
from typing import Optional
from app.core.config import Settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class LLMService:
    """
    Service for interacting with LLM providers.
    Currently supports OpenRouter.
    """
    
    def __init__(self):
        self.settings = Settings()
        self.base_url = "https://openrouter.ai/api/v1"
    
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
        
        if not hasattr(self.settings, 'openrouter_api_key'):
            logger.error("openrouter_api_key_not_configured")
            raise ValueError("OPENROUTER_API_KEY not configured in settings")
        
        api_key = self.settings.openrouter_api_key
        
        if not api_key or api_key == "":
            logger.error("openrouter_api_key_empty")
            raise ValueError("OPENROUTER_API_KEY is empty")
        
        if not model:
            model = "deepseek/deepseek-chat-v3.1:free"
        
        logger.info("llm_request", model=model, has_system_prompt=bool(system_prompt))
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": self.settings.app_name,
        }
        
        payload = {
            "model": model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            logger.info("sending_request_to_openrouter", url=f"{self.base_url}/chat/completions")
            
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload
            )
            
            logger.info("received_response", status_code=response.status_code)
            
            if response.status_code != 200:
                logger.error("llm_api_error", status_code=response.status_code, response_text=response.text)
                raise Exception(f"LLM API error: {response.status_code} - {response.text}")
            
            data = response.json()
            generated_text = data["choices"][0]["message"]["content"]
            
            logger.info("generation_success", text_length=len(generated_text))
            return generated_text
