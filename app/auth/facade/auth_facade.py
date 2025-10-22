from typing import Optional
from datetime import datetime, timedelta
from beanie import PydanticObjectId

from app.auth.db.models import User
from app.auth.db.repository import UserRepository
from app.auth.config import AuthModuleConfig
from app.core.services.jwt_service import JWTService
from app.core.services.password_service import PasswordService


class AuthFacade:
    """
    Facade for authentication business logic and orchestration.
    Coordinates between repository, JWT service, and password service.
    """
    
    def __init__(
        self,
        repository: Optional[UserRepository] = None,
        jwt_service: Optional[JWTService] = None,
        password_service: Optional[PasswordService] = None
    ):
        self.repository = repository or UserRepository()
        self.jwt_service = jwt_service or JWTService()
        self.password_service = password_service or PasswordService()
        self.config = AuthModuleConfig()
    
    async def register(self, email: str, password: str) -> User:
        """
        Register a new user.
        
        Args:
            email: User email address
            password: Plain text password
            
        Returns:
            Created user
            
        Raises:
            ValueError: If validation fails or email already exists
        """
        # Validate email and password
        self._validate_email(email)
        self._validate_password(password)
        
        # Check if email already exists
        if await self.repository.email_exists(email):
            raise ValueError("An account with this email already exists")
        
        # Hash password
        hashed_password = self.password_service.hash_password(password)
        
        # Create user
        user = await self.repository.create(
            email=email.lower(),
            hashed_password=hashed_password
        )
        
        return user
    
    async def login(self, email: str, password: str) -> tuple[str, User]:
        """
        Authenticate user and generate access token.
        
        Args:
            email: User email address
            password: Plain text password
            
        Returns:
            Tuple of (access_token, user)
            
        Raises:
            ValueError: If credentials are invalid
        """
        # Find user by email
        user = await self.repository.find_by_email(email)
        if not user:
            raise ValueError("Invalid email or password")
        
        # Verify password
        if not self.password_service.verify_password(password, user.hashed_password):
            raise ValueError("Invalid email or password")
        
        # Check if user is active
        if not user.is_active:
            raise ValueError("Account is deactivated")
        
        # Update last login
        await self.repository.update_last_login(user.id)
        
        # Generate JWT token
        token_data = {
            "sub": str(user.id),
            "email": user.email,
            "exp": datetime.utcnow() + timedelta(minutes=self.config.access_token_expire_minutes)
        }
        access_token = self.jwt_service.encode_token(token_data)
        
        return access_token, user
    
    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        """
        Get user by ID.
        
        Args:
            user_id: User ID string
            
        Returns:
            User or None if not found
        """
        try:
            obj_id = PydanticObjectId(user_id)
        except Exception:
            return None
        
        return await self.repository.find_by_id(obj_id)
    
    async def verify_token(self, token: str) -> Optional[User]:
        """
        Verify JWT token and return user.
        
        Args:
            token: JWT access token
            
        Returns:
            User if token is valid, None otherwise
        """
        try:
            payload = self.jwt_service.decode_token(token)
            user_id = payload.get("sub")
            
            if not user_id:
                return None
            
            return await self.get_user_by_id(user_id)
        except Exception:
            return None
    
    async def reset_password(self, email: str) -> bool:
        """
        Initiate password reset process.
        
        Args:
            email: User email address
            
        Returns:
            True if email exists (always returns True to prevent email enumeration)
        """
        # Check if user exists
        user = await self.repository.find_by_email(email)
        
        if user:
            # TODO: Generate reset token and send email
            # For now, just return True
            pass
        
        # Always return True to prevent email enumeration
        return True
    
    def _validate_email(self, email: str) -> None:
        """Validate email format and length."""
        if not email or not email.strip():
            raise ValueError("Email cannot be empty")
        
        if len(email) > self.config.max_email_length:
            raise ValueError(f"Email cannot exceed {self.config.max_email_length} characters")
        
        if "@" not in email or "." not in email.split("@")[-1]:
            raise ValueError("Invalid email format")
    
    def _validate_password(self, password: str) -> None:
        """Validate password strength."""
        if not password:
            raise ValueError("Password cannot be empty")
        
        if len(password) < self.config.min_password_length:
            raise ValueError(f"Password must be at least {self.config.min_password_length} characters")
        
        if len(password) > self.config.max_password_length:
            raise ValueError(f"Password cannot exceed {self.config.max_password_length} characters")
