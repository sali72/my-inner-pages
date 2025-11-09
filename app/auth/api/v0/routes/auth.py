from fastapi import APIRouter, HTTPException, status, Depends

from app.auth.api.v0.schemas.request import RegisterRequest, LoginRequest, ResetPasswordRequest
from app.auth.api.v0.schemas.response import (
    UserResponse,
    LoginResponse,
    MessageResponse
)
from app.auth.facade.auth_facade import AuthFacade
from app.auth.deps import get_auth_facade
from app.auth.db.models import User
from app.core.deps.auth import get_current_user
from app.core.deps.database import get_db


router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post(
    "/register",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    dependencies=[Depends(get_db)]
)
async def register(
    request: RegisterRequest,
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
        request.validate_passwords_match()
        
        # Register user
        await facade.register(
            email=request.email,
            password=request.password
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
    "/login",
    response_model=LoginResponse,
    summary="Login user",
    dependencies=[Depends(get_db)]
)
async def login(
    request: LoginRequest,
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
            email=request.email,
            password=request.password
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
    "/me",
    response_model=UserResponse,
    summary="Get current user",
    dependencies=[Depends(get_db)]
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
    "/reset-password",
    response_model=MessageResponse,
    summary="Request password reset"
)
async def reset_password(
    request: ResetPasswordRequest,
    facade: AuthFacade = Depends(get_auth_facade)
) -> MessageResponse:
    """
    Request password reset email.
    
    - **email**: User email address
    
    Note: Always returns success to prevent email enumeration.
    """
    await facade.reset_password(request.email)
    
    return MessageResponse(
        message="If an account with this email exists, a password reset link has been sent."
    )


@router.get(
    "/verify",
    response_model=UserResponse,
    summary="Verify JWT token",
    dependencies=[Depends(get_db)]
)
async def verify_token(
    current_user: User = Depends(get_current_user)
) -> UserResponse:
    """
    Verify JWT token and return user information.
    
    Requires valid JWT token in Authorization header.
    """
    return UserResponse.from_document(current_user)
