from fastapi import APIRouter, Depends, HTTPException, status

from app.admin.api.schemas import AdminStatsResponse
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
    summary="Get operational analytics and metrics",
)
async def get_admin_stats(
    current_user: User = Depends(get_current_admin_user),
    facade: AdminStatsFacade = Depends(get_admin_stats_facade),
):
    """Retrieve overview metrics for user acquisition, activity, and engagement."""
    try:
        return await facade.get_stats()
    except Exception as e:
        logger.error("get_admin_stats_failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve admin statistics",
        )
