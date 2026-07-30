from pydantic_settings import BaseSettings, SettingsConfigDict


class ChatModuleConfig(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
        env_prefix="CHAT_",
    )

    max_messages_for_context: int = 20
    max_title_length: int = 100
