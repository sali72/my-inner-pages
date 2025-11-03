from pydantic import BaseModel


class MemoryModuleConfig(BaseModel):
    """Memory module specific configuration."""
    
    # Context retrieval settings
    default_context_limit: int = 10
    max_context_limit: int = 50
