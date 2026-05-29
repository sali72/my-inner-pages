from pydantic_settings import BaseSettings, SettingsConfigDict


class MemoryModuleConfig(BaseSettings):
    """Memory module specific configuration, loadable from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
        env_prefix="MEMORY_",
    )

    default_context_limit: int = 10
    max_context_limit: int = 50

    max_journals_for_context: int = 5

    max_journals_for_updater: int = 50
    update_after_entries: int = 5
    update_after_words: int = 5000
    updater_max_tokens: int = 1000
    updater_temperature: float = 0.3
