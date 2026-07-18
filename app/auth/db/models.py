from datetime import datetime, timezone
from typing import Optional
from beanie import Document
from pydantic import BaseModel, Field, EmailStr


class UserPreferences(BaseModel):
    """User preferences for theme and writing settings."""
    mode: str = "system"
    accent: str = "amber"
    fontStyle: str = "serif"
    fontSize: str = "medium"


class User(Document):
    """User document model for MongoDB."""
    
    email: EmailStr = Field(..., unique=True, max_length=255)
    hashed_password: str = Field(...)
    
    # User metadata
    role: str = Field(default="user")
    is_active: bool = Field(default=True)
    is_verified: bool = Field(default=False)
    
    # Preferences
    preferences: UserPreferences = Field(default_factory=UserPreferences)
    
    # Feedback trigger flags (at most once per trigger)
    feedback_triggers: dict[str, bool] = Field(default_factory=dict)
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_login: Optional[datetime] = None
    login_count: int = Field(default=0)
    
    class Settings:
        name = "users"
        indexes = [
            "email",
            "created_at",
            [("email", 1)],
        ]
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "is_active": True,
                "is_verified": False
            }
        }
    
    def update_last_login(self) -> None:
        """Update the last login timestamp."""
        self.last_login = datetime.now(timezone.utc)
        self.login_count += 1
