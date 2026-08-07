from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.admin.api.schemas import (
    AdminStatsResponse,
    UserItemSchema,
    UserListResponse,
    UserStatusUpdate,
)
from app.admin.deps import get_admin_stats_facade
from app.admin.facade import AdminStatsFacade
from app.auth.db.models import User
from app.auth.deps import get_current_admin_user
from app.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/admin", tags=["admin-stats"])


@router.get(
    "/stats",
    response_model=AdminStatsResponse,
    summary="Get operational analytics and metrics for a selected time period",
)
async def get_admin_stats(
    period: str = Query(
        "14d",
        pattern="^(7d|14d|30d|90d)$",
        description="Time period window (7d, 14d, 30d, 90d)",
    ),
    current_user: User = Depends(get_current_admin_user),
    facade: AdminStatsFacade = Depends(get_admin_stats_facade),
):
    """Retrieve overview metrics for user acquisition, activity, and engagement."""
    try:
        return await facade.get_stats(period=period)
    except Exception as e:
        logger.error("get_admin_stats_failed", error=str(e), period=period)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve admin statistics",
        )


@router.get(
    "/users",
    response_model=UserListResponse,
    summary="Get paginated user directory with email search",
)
async def get_admin_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    search: Optional[str] = Query(None, description="Search by email substring"),
    current_user: User = Depends(get_current_admin_user),
    facade: AdminStatsFacade = Depends(get_admin_stats_facade),
):
    """Retrieve paginated list of registered users with email and signup details."""
    try:
        return await facade.get_users_list(skip=skip, limit=limit, search=search)
    except Exception as e:
        logger.error("get_admin_users_failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user directory",
        )


@router.patch(
    "/users/{user_id}/status",
    response_model=UserItemSchema,
    summary="Update user activation status (deactivate/reactivate)",
)
async def update_user_status(
    user_id: str,
    payload: UserStatusUpdate,
    current_user: User = Depends(get_current_admin_user),
    facade: AdminStatsFacade = Depends(get_admin_stats_facade),
):
    """Deactivate or reactivate a user account with audit logging and session revocation."""
    try:
        updated_user = await facade.update_user_status(
            target_user_id=user_id,
            is_active=payload.is_active,
            admin_user=current_user,
        )
        logger.warning(
            "admin_user_status_updated",
            admin_id=str(current_user.id),
            target_user_id=user_id,
            is_active=payload.is_active,
        )
        return updated_user
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err),
        )
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    except Exception as e:
        logger.error("admin_update_user_status_failed", error=str(e), user_id=user_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user status",
        )


@router.delete(
    "/users/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Permanently delete a user account and cascading data",
)
async def delete_user(
    user_id: str,
    current_user: User = Depends(get_current_admin_user),
    facade: AdminStatsFacade = Depends(get_admin_stats_facade),
):
    """Cascading deletion of user account, journals, chat sessions, and refresh tokens."""
    try:
        await facade.delete_user(target_user_id=user_id, admin_user=current_user)
        logger.warning(
            "admin_user_deleted",
            admin_id=str(current_user.id),
            target_user_id=user_id,
        )
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err),
        )
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    except Exception as e:
        logger.error("admin_delete_user_failed", error=str(e), user_id=user_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete user",
        )
