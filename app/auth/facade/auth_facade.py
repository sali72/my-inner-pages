from datetime import datetime, timedelta
from typing import Optional

from beanie import PydanticObjectId

from app.auth.config import AuthModuleConfig
from app.auth.db.models import User
from app.auth.db.repository import UserRepository
from app.core.cache import user_cache
from app.core.exceptions import DuplicateDocumentException, RepositoryException
from app.core.logging import get_logger
from app.core.services.jwt_service import JWTService
from app.core.services.password_service import PasswordService

logger = get_logger(__name__)


class AuthFacade:
    """
    Facade for authentication business logic and orchestration.
    Coordinates between repository, JWT service, and password service.
    """

    def __init__(
        self,
        repository: UserRepository,
        jwt_service: JWTService,
        password_service: PasswordService,
        config: AuthModuleConfig,
    ):
        self.repository = repository
        self.jwt_service = jwt_service
        self.password_service = password_service
        self.config = config

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
            RepositoryException: If database operation fails
        """
        # Validate email and password
        self._validate_email(email)
        self._validate_password(password)

        try:
            # Check if email already exists
            if await self.repository.email_exists(email):
                raise ValueError("An account with this email already exists")

            # Hash password
            hashed_password = self.password_service.hash_password(password)

            # Create user
            user = await self.repository.create(
                email=email.lower(), hashed_password=hashed_password
            )

            logger.info("user_registered", user_id=str(user.id), email=email)
            return user
        except DuplicateDocumentException:
            # Race condition: email was created between check and insert
            logger.warning("user_registration_race_condition", email=email)
            raise ValueError("An account with this email already exists")
        except RepositoryException:
            logger.error("user_registration_failed", email=email)
            raise

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
            "exp": datetime.utcnow()
            + timedelta(minutes=self.config.access_token_expire_minutes),
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
        Verify JWT token and return user (with caching).

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

            # Check cache first
            cache_key = f"user:{user_id}"
            cached_user = user_cache.get(cache_key)
            if cached_user:
                return cached_user

            # Fetch from database
            user = await self.get_user_by_id(user_id)

            # Cache for future requests
            if user:
                user_cache.set(cache_key, user, ttl=300)  # 5 minutes

            return user
        except Exception:
            return None

    async def reset_password(self, email: str) -> bool:
        """
        Initiate password reset process.

        Args:
            email: User email address

        Returns:
            True (always returns True to prevent email enumeration)

        Note:
            In production, this should:
            1. Generate a secure reset token
            2. Store token with expiration in database
            3. Send email with reset link
            4. Implement /reset-password/{token} endpoint to complete reset

            For now, this is a placeholder that logs the request.
        """
        # Check if user exists
        user = await self.repository.find_by_email(email)

        if user:
            logger.info("password_reset_requested", email=email, user_id=str(user.id))
            # In production: Generate token, store it, send email
            # Example:
            # reset_token = secrets.token_urlsafe(32)
            # await self.repository.store_reset_token(user.id, reset_token, expires_in=3600)
            # await email_service.send_reset_email(email, reset_token)
        else:
            logger.info("password_reset_requested_unknown_email", email=email)

        # Always return True to prevent email enumeration
        return True

    def _validate_email(self, email: str) -> None:
        """Validate email format and length."""
        if not email or not email.strip():
            raise ValueError("Email cannot be empty")

        if len(email) > self.config.max_email_length:
            raise ValueError(
                f"Email cannot exceed {self.config.max_email_length} characters"
            )

        if "@" not in email or "." not in email.split("@")[-1]:
            raise ValueError("Invalid email format")

    def _validate_password(self, password: str) -> None:
        """Validate password strength."""
        if not password:
            raise ValueError("Password cannot be empty")

        if len(password) < self.config.min_password_length:
            raise ValueError(
                f"Password must be at least {self.config.min_password_length} characters"
            )

        if len(password) > self.config.max_password_length:
            raise ValueError(
                f"Password cannot exceed {self.config.max_password_length} characters"
            )
