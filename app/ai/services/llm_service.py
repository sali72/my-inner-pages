import httpx
from typing import Optional
from app.core.config import Settings


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
        if not hasattr(self.settings, 'openrouter_api_key'):
            raise ValueError("OPENROUTER_API_KEY not configured in settings")
        
        api_key = self.settings.openrouter_api_key
        
        if not model:
            model = "anthropic/claude-3.5-sonnet"
        
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
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload
            )
            
            if response.status_code != 200:
                raise Exception(f"LLM API error: {response.status_code} - {response.text}")
            
            data = response.json()
            return data["choices"][0]["message"]["content"]
