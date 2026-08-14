from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class UserPreferencesResponse(BaseModel):
    """Response schema for user preferences."""
    mode: str = Field(..., description="Theme mode: light, dark, or system")
    accent: str = Field(..., description="Accent color")
    fontStyle: str = Field(..., description="Font style: serif, sans, or mono")
    fontSize: str = Field(..., description="Font size: small, medium, large, or x-large")


class UserResponse(BaseModel):
    """Response schema for user data."""
    
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "email": "user@example.com",
                "is_active": True,
                "is_verified": False,
                "created_at": "2024-01-15T10:30:00Z"
            }
        }
    )
    
    id: str = Field(..., description="User ID")
    email: str = Field(..., description="User email")
    role: str = Field(..., description="User role")
    is_active: bool = Field(..., description="Whether user is active")
    is_verified: bool = Field(..., description="Whether email is verified")
    created_at: datetime = Field(..., description="Account creation timestamp")
    last_login: Optional[datetime] = Field(None, description="Last login timestamp")
    login_count: int = Field(default=0, description="Number of times user has logged in")
    preferences: Optional[UserPreferencesResponse] = Field(None, description="User preferences")
    feedback_triggers: dict[str, bool] = Field(default_factory=dict, description="Feedback trigger seen flags")
    
    @classmethod
    def from_document(cls, user) -> "UserResponse":
        """Create response from User document."""
        prefs = None
        if user.preferences:
            prefs = UserPreferencesResponse(
                mode=user.preferences.mode,
                accent=user.preferences.accent,
                fontStyle=user.preferences.fontStyle,
                fontSize=user.preferences.fontSize
            )
        return cls(
            id=str(user.id),
            email=user.email,
            role=user.role,
            is_active=user.is_active,
            is_verified=user.is_verified,
            created_at=user.created_at,
            last_login=user.last_login,
            login_count=user.login_count,
            preferences=prefs,
            feedback_triggers=user.feedback_triggers,
        )


class LoginResponse(BaseModel):
    """Response schema for successful login."""
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "user": {
                    "id": "507f1f77bcf86cd799439011",
                    "email": "user@example.com",
                    "is_active": True,
                    "is_verified": False,
                    "created_at": "2024-01-15T10:30:00Z"
                }
            }
        }
    )
    
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    user: UserResponse = Field(..., description="User information")


from app.core.schemas import MessageResponse

__all__ = ["UserPreferencesResponse", "UserResponse", "LoginResponse", "MessageResponse"]
