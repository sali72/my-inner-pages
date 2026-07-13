from pydantic import BaseModel


class AuthModuleConfig(BaseModel):
    """Auth module specific configuration."""
    
    # JWT settings
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 24 hours
    
    # Password settings
    min_password_length: int = 8
    max_password_length: int = 72
    
    # Email settings
    max_email_length: int = 255
