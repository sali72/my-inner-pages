from fastapi import APIRouter, Depends, HTTPException, status
from app.core.deps.auth import get_current_user
from app.core.deps.settings import get_settings
from app.core.config import Settings
from app.auth.db.models import User
from app.memory.deps import get_user_model_updater
from app.memory.services.user_model_updater import UserModelUpdater
from app.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/memory", tags=["memory"])


@router.post("/update-user-model", summary="Manually trigger user model update (dev only)")
async def trigger_user_model_update(
    current_user: User = Depends(get_current_user),
    updater: UserModelUpdater = Depends(get_user_model_updater),
    settings: Settings = Depends(get_settings),
):
    if settings.is_production:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is disabled in production",
        )

    logger.info("manual_user_model_update_triggered", user_id=str(current_user.id))

    try:
        updated = await updater.update(str(current_user.id))
        return {
            "status": "ok",
            "version": updated.version,
            "updatedAt": updated.updatedAt.isoformat() if updated.updatedAt else None,
            "stats": {
                "totalEntries": updated.stats.totalEntries,
                "totalWords": updated.stats.totalWords,
            },
            "patterns": len(updated.patterns),
            "activeThemes": len(updated.activeThemes),
            "conversationGuidelines": len(updated.conversationGuidelines),
        }
    except Exception as e:
        logger.exception("manual_user_model_update_failed", user_id=str(current_user.id))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="User model update failed",
        )


@router.get("/user-model", summary="Get current user model (dev only)")
async def get_user_model(
    current_user: User = Depends(get_current_user),
    updater: UserModelUpdater = Depends(get_user_model_updater),
    settings: Settings = Depends(get_settings),
):
    if settings.is_production:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is disabled in production",
        )

    user_model = await updater.user_model_repository.find_by_user_id(str(current_user.id))
    if not user_model:
        return {"status": "no_model", "message": "No user model exists yet"}

    return {
        "status": "ok",
        "version": user_model.version,
        "updatedAt": user_model.updatedAt.isoformat() if user_model.updatedAt else None,
        "createdAt": user_model.createdAt.isoformat(),
        "stats": user_model.stats.model_dump(),
        "baseline": user_model.baseline.model_dump(),
        "patterns": [p.model_dump() for p in user_model.patterns],
        "activeThemes": user_model.activeThemes,
        "conversationGuidelines": user_model.conversationGuidelines,
    }
