from fastapi import Depends
from app.core.config import Settings
from app.core.deps.settings import get_settings
from app.core.services.jwt_service import JWTService
from app.core.services.password_service import PasswordService


def get_jwt_service(settings: Settings = Depends(get_settings)) -> JWTService:
    """Get JWT service with injected settings."""
    return JWTService(settings)


def get_password_service() -> PasswordService:
    """Get password service."""
    return PasswordService()
