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
    openrouter_model: str = "deepseek/deepseek-chat-v3.1:free"
    openrouter_timeout: int = 30
    
    # Feature flags
    enable_mirror: bool = True
