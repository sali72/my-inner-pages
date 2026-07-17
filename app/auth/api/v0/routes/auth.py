from fastapi import APIRouter, HTTPException, status, Depends, Request

from app.auth.api.v0.schemas.request import RegisterRequest, LoginRequest, ResetPasswordRequest, UpdatePreferencesRequest
from app.auth.api.v0.schemas.response import (
    UserResponse,
    LoginResponse,
    MessageResponse
)
from app.auth.facade.auth_facade import AuthFacade
from app.auth.deps import get_auth_facade
from app.auth.db.models import User
from app.core.deps.auth import get_current_user
from app.core.rate_limit import limiter
from app.auth.api.config import AuthRoutes


# Router prefix is set in main.py, routes here are relative to /auth
router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post(
    AuthRoutes.REGISTER,
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
@limiter.limit("5/minute")
async def register(
    request: Request,
    register_request: RegisterRequest,
    facade: AuthFacade = Depends(get_auth_facade)
) -> MessageResponse:
    """
    Register a new user account.
    
    - **email**: Valid email address (required)
    - **password**: Password (min 8 characters, required)
    - **confirm_password**: Password confirmation (must match password)
    """
    try:
        # Validate passwords match
        register_request.validate_passwords_match()
        
        # Register user
        await facade.register(
            email=register_request.email,
            password=register_request.password
        )
        
        return MessageResponse(
            message="Registration successful. Please check your email to verify your account."
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post(
    AuthRoutes.LOGIN,
    response_model=LoginResponse,
    summary="Login user",
)
@limiter.limit("5/minute")
async def login(
    request: Request,
    login_request: LoginRequest,
    facade: AuthFacade = Depends(get_auth_facade)
) -> LoginResponse:
    """
    Authenticate user and receive access token.
    
    - **email**: User email address
    - **password**: User password
    
    Returns JWT access token for authenticated requests.
    """
    try:
        access_token, user = await facade.login(
            email=login_request.email,
            password=login_request.password
        )
        
        return LoginResponse(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse.from_document(user)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"}
        )


@router.get(
    AuthRoutes.ME,
    response_model=UserResponse,
    summary="Get current user"
)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
) -> UserResponse:
    """
    Get current authenticated user information.
    
    Requires valid JWT token in Authorization header.
    """
    return UserResponse.from_document(current_user)


@router.post(
    AuthRoutes.RESET_PASSWORD,
    response_model=MessageResponse,
    summary="Request password reset"
)
@limiter.limit("5/minute")
async def reset_password(
    request: Request,
    reset_request: ResetPasswordRequest,
    facade: AuthFacade = Depends(get_auth_facade)
) -> MessageResponse:
    """
    Request password reset email.
    
    - **email**: User email address
    
    Note: Always returns success to prevent email enumeration.
    """
    await facade.reset_password(reset_request.email)
    
    return MessageResponse(
        message="If an account with this email exists, a password reset link has been sent."
    )


@router.get(
    AuthRoutes.VERIFY,
    response_model=UserResponse,
    summary="Verify JWT token"
)
async def verify_token(
    current_user: User = Depends(get_current_user)
) -> UserResponse:
    """
    Verify JWT token and return user information.
    
    Requires valid JWT token in Authorization header.
    """
    return UserResponse.from_document(current_user)


@router.put(
    AuthRoutes.PREFERENCES,
    response_model=UserResponse,
    summary="Update user preferences"
)
async def update_preferences(
    request: UpdatePreferencesRequest,
    current_user: User = Depends(get_current_user),
    facade: AuthFacade = Depends(get_auth_facade)
) -> UserResponse:
    """
    Update current user's preferences (partial update).
    
    Only provided fields will be updated; omitted fields retain their current values.
    """
    preferences = request.model_dump(exclude_none=True)
    user = await facade.update_preferences(str(current_user.id), preferences)
    return UserResponse.from_document(user)
