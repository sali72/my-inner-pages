from functools import lru_cache
from app.core.config import Settings


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached application settings.
    Settings are loaded once and cached for the application lifetime.
    """
    return Settings()
