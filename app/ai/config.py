from pydantic import BaseModel


class AIModuleConfig(BaseModel):
    """AI module specific configuration."""
    
    # Mirror reflection settings
    max_journals_for_mirror: int = 10
    mirror_reflection_modes: list[str] = [
        "emotional",
        "cognitive", 
        "behavioral",
        "relational"
    ]
    
    # OpenRouter settings
    openrouter_model: str = "anthropic/claude-3.5-sonnet"
    openrouter_timeout: int = 30
    
    # Feature flags
    enable_mirror: bool = True
