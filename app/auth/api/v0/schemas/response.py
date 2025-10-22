from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


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
    is_active: bool = Field(..., description="Whether user is active")
    is_verified: bool = Field(..., description="Whether email is verified")
    created_at: datetime = Field(..., description="Account creation timestamp")
    last_login: Optional[datetime] = Field(None, description="Last login timestamp")
    
    @classmethod
    def from_document(cls, user) -> "UserResponse":
        """Create response from User document."""
        return cls(
            id=str(user.id),
            email=user.email,
            is_active=user.is_active,
            is_verified=user.is_verified,
            created_at=user.created_at,
            last_login=user.last_login
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


class MessageResponse(BaseModel):
    """Generic message response."""
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "message": "Registration successful"
            }
        }
    )
    
    message: str = Field(..., description="Response message")
