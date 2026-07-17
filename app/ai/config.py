from pydantic_settings import BaseSettings, SettingsConfigDict


class AIModuleConfig(BaseSettings):
    """AI module configuration loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    # LLM Provider Settings
    use_mock_llm: bool = False
    llm_providers_path: str = "llm_providers.json"

    # LLM Defaults (used when not overridden per-call)
    llm_max_tokens: int = 500
    llm_temperature: float = 0.7
    llm_timeout: int = 30

    # Mirror Reflection Settings
    max_journals_for_mirror: int = 10
    mirror_reflection_modes: list[str] = [
        "emotional",
        "cognitive",
        "behavioral",
        "relational"
    ]

    # Chat Settings
    chat_max_tokens: int = 1000
    chat_temperature: float = 0.7
    max_journals_for_chat_context: int = 10

    # WebSocket Settings
    ws_ping_interval: int = 20
    ws_pong_timeout: int = 25
    ws_connection_close_timeout: int = 30
    ws_generation_grace_period: int = 10
    ws_max_connections_per_user: int = 5
    ws_message_dedup_ttl: int = 300

    # Feature Flags
    enable_mirror: bool = True
