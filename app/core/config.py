from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
        frozen=True
    )
    
    # MongoDB Configuration
    mongo_url: str = "mongodb://localhost:27017"
    database_name: str = "journaling_app"
    
    # Application Configuration
    environment: str = "development"
    app_name: str = "Note Taking API"
    app_version: str = "0.1.0"
    
    # JWT Configuration
    jwt_secret_key: str = "dev-secret-key-change-in-production"
    
    # AI Configuration
    openrouter_api_key: str = ""
    use_mock_llm: bool = False  # Set to True to use mock LLM (for testing/development)
    
    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"
