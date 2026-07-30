from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Single .env lives at the repo root, not in backend/
_REPO_ROOT = Path(__file__).resolve().parents[3]


class ChatModuleConfig(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_REPO_ROOT / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
        env_prefix="CHAT_",
    )

    max_messages_for_context: int = 20
    max_title_length: int = 100
