from datetime import datetime
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
    is_active: bool = Field(default=True)
    is_verified: bool = Field(default=False)
    
    # Preferences
    preferences: UserPreferences = Field(default_factory=UserPreferences)
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    
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
        self.last_login = datetime.utcnow()
