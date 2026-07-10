from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.auth.facade.auth_facade import AuthFacade
from app.auth.db.repository import UserRepository
from app.auth.db.models import User
from app.auth.config import AuthModuleConfig
from app.core.services.jwt_service import JWTService
from app.core.services.password_service import PasswordService
from app.core.deps.services import get_jwt_service, get_password_service


security = HTTPBearer()


def get_auth_config() -> AuthModuleConfig:
    """Get auth module configuration."""
    return AuthModuleConfig()


def get_user_repository() -> UserRepository:
    """Get user repository."""
    return UserRepository()


def get_auth_facade(
    repository: UserRepository = Depends(get_user_repository),
    jwt_service: JWTService = Depends(get_jwt_service),
    password_service: PasswordService = Depends(get_password_service),
    config: AuthModuleConfig = Depends(get_auth_config)
) -> AuthFacade:
    """Get auth facade with all dependencies injected."""
    return AuthFacade(
        repository=repository,
        jwt_service=jwt_service,
        password_service=password_service,
        config=config
    )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    facade: AuthFacade = Depends(get_auth_facade)
) -> User:
    """
    Dependency to get current authenticated user from JWT token.
    
    Args:
        credentials: HTTP Bearer credentials from request
        facade: Auth facade (injected)
        
    Returns:
        Authenticated user
        
    Raises:
        HTTPException: If token is invalid or user not found
    """
    token = credentials.credentials
    user = await facade.verify_token(token)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated"
        )
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency to get current active user.
    
    Args:
        current_user: Current user from get_current_user dependency
        
    Returns:
        Active user
        
    Raises:
        HTTPException: If user is not active
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated"
        )
    
    return current_user


async def get_current_admin_user(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """
    Dependency to get current active admin user.
    
    Args:
        current_user: Current user from get_current_active_user dependency
        
    Returns:
        Admin user
        
    Raises:
        HTTPException: If user is not an admin
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not have administrator privileges"
        )
    
    return current_user
