from typing import Optional
from beanie import Document
from pydantic import BaseModel, Field, ConfigDict


class LiteLLMParams(BaseModel):
    model_config = ConfigDict(extra="allow")

    model: str = Field(..., description="The LiteLLM model string, e.g., openrouter/google/gemini-flash-1.5:free")
    api_base: Optional[str] = Field(None, description="Custom API endpoint base URL, optional")
    api_key: Optional[str] = Field(None, description="API Key placeholder or environment variable wrapper like ${OPENROUTER_API_KEY}")
    rpm: Optional[int] = Field(None, description="Requests Per Minute rate limit")
    tpm: Optional[int] = Field(None, description="Tokens Per Minute rate limit")


class LLMProvider(Document):
    model_name: str = Field(default="default", description="Router alias used in code (usually 'default')")
    litellm_params: LiteLLMParams = Field(..., description="Parameters passed directly to LiteLLM")
    order: int = Field(..., description="Priority order for routing failover")
    is_active: bool = Field(default=True, description="Whether this provider is active and available for routing")

    class Settings:
        name = "llm_providers"
        indexes = [
            "order",
            "is_active",
        ]

    def to_litellm_dict(self) -> dict:
        """Convert the model configuration to a dictionary structure matching LiteLLM format."""
        params_dict = self.litellm_params.model_dump(exclude_none=True)
        return {
            "model_name": self.model_name,
            "litellm_params": params_dict,
            "order": self.order
        }
