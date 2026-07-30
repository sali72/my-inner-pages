from typing import Optional, Literal
from pydantic import BaseModel, Field, EmailStr, field_validator, ConfigDict

from app.auth.config import AuthModuleConfig

_AUTH_CONFIG = AuthModuleConfig()


class RegisterRequest(BaseModel):
    """Request schema for user registration."""
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "email": "user@example.com",
                "password": "securepassword123",
                "confirm_password": "securepassword123"
            }
        }
    )
    
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(
        ...,
        min_length=_AUTH_CONFIG.min_password_length,
        max_length=_AUTH_CONFIG.max_password_length,
        description="User password",
    )
    confirm_password: str = Field(..., description="Password confirmation")
    
    @field_validator("email")
    @classmethod
    def lowercase_email(cls, v: str) -> str:
        """Convert email to lowercase."""
        return v.lower().strip()
    
    def validate_passwords_match(self) -> None:
        """Validate that passwords match."""
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match")


class UpdatePreferencesRequest(BaseModel):
    """Request schema for updating user preferences."""
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "mode": "dark",
                "accent": "dusk",
                "fontStyle": "sans",
                "fontSize": "large"
            }
        }
    )
    
    mode: Optional[Literal["light", "dark", "system"]] = Field(None, description="Theme mode: light, dark, or system")
    accent: Optional[Literal["sage", "dusk", "amber", "slate", "blush", "ink", "sand", "moss"]] = Field(None, description="Accent color")
    fontStyle: Optional[Literal["serif", "sans", "mono"]] = Field(None, description="Font style: serif, sans, or mono")
    fontSize: Optional[Literal["small", "medium", "large", "x-large"]] = Field(None, description="Font size: small, medium, large, or x-large")


class LoginRequest(BaseModel):
    """Request schema for user login."""
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "email": "user@example.com",
                "password": "securepassword123"
            }
        }
    )
    
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., description="User password")
    
    @field_validator("email")
    @classmethod
    def lowercase_email(cls, v: str) -> str:
        """Convert email to lowercase."""
        return v.lower().strip()


class ResendVerificationRequest(BaseModel):
    """Request schema for resending verification email."""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "email": "user@example.com"
            }
        }
    )

    email: EmailStr = Field(..., description="User email address")

    @field_validator("email")
    @classmethod
    def lowercase_email(cls, v: str) -> str:
        """Convert email to lowercase."""
        return v.lower().strip()


class ResetPasswordRequest(BaseModel):
    """Request schema for password reset."""
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "email": "user@example.com"
            }
        }
    )
    
    email: EmailStr = Field(..., description="User email address")
    
    @field_validator("email")
    @classmethod
    def lowercase_email(cls, v: str) -> str:
        """Convert email to lowercase."""
        return v.lower().strip()
