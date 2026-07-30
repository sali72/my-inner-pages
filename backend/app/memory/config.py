from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Single .env lives at the repo root, not in backend/
_REPO_ROOT = Path(__file__).resolve().parents[3]


class MemoryModuleConfig(BaseSettings):
    """Memory module specific configuration, loadable from environment variables."""

    model_config = SettingsConfigDict(
        env_file=_REPO_ROOT / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
        env_prefix="MEMORY_",
    )

    default_context_limit: int = 10
    max_context_limit: int = 50

    max_journals_for_context: int = 5

    max_journals_for_updater: int = 50
    min_entries_for_update: int = 1
    update_after_entries: int = 5
    update_after_words: int = 5000
    updater_max_tokens: int = 1000
    updater_temperature: float = 0.3
