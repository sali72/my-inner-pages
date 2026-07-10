from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


class LiteLLMParamsSchema(BaseModel):
    model_config = ConfigDict(extra="allow")  # Allow any other LiteLLM-supported parameters

    model: str = Field(..., description="The model string, e.g., openrouter/google/gemini-flash-1.5:free")
    api_base: Optional[str] = Field(None, description="API Base URL, optional")
    api_key: Optional[str] = Field(None, description="API Key placeholder or environment variable wrapper like ${OPENROUTER_API_KEY}")
    rpm: Optional[int] = Field(None, description="Requests Per Minute rate limit")
    tpm: Optional[int] = Field(None, description="Tokens Per Minute rate limit")


class ProviderConfigSchema(BaseModel):
    model_name: str = Field("default", description="Alias used in routing (usually 'default')")
    litellm_params: LiteLLMParamsSchema = Field(..., description="Parameters passed directly to LiteLLM")
    order: Optional[int] = Field(None, description="Priority order for routing failover")
    is_active: bool = Field(True, description="Whether this provider is active and available for routing")


class ProviderTestResult(BaseModel):
    index: int
    model: str
    status: str  # "WORKING" or "FAILED"
    latency: float
    details: str


class DiagnosticsResponse(BaseModel):
    total_models: int
    working_models: int
    failed_models: int
    results: List[ProviderTestResult]
