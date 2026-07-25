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
    llm_rate_limit: int = 10

    # Feature Flags
    enable_mirror: bool = True
