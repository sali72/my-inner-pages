from fastapi import Depends
from app.ai.services.mirror_service import MirrorService
from app.ai.services.llm_service import LLMService
from app.ai.config import AIModuleConfig
from app.memory.service import MemoryService
from app.memory.deps import get_memory_service
from app.core.config import Settings
from app.core.deps.settings import get_settings


def get_ai_config() -> AIModuleConfig:
    """Get AI module configuration."""
    return AIModuleConfig()


def get_llm_service(settings: Settings = Depends(get_settings)) -> LLMService:
    """Get LLM service with injected settings."""
    return LLMService(settings)


def get_mirror_service(
    llm_service: LLMService = Depends(get_llm_service),
    memory_service: MemoryService = Depends(get_memory_service),
    config: AIModuleConfig = Depends(get_ai_config)
) -> MirrorService:
    """Get mirror service with all dependencies injected."""
    return MirrorService(
        llm_service=llm_service,
        memory_service=memory_service,
        config=config
    )
