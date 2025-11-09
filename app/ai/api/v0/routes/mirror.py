from fastapi import APIRouter, HTTPException, status, Query, Depends
from typing import Annotated, Optional

from app.ai.api.v0.schemas.response import MirrorReflectionResponse
from app.ai.services.mirror_service import MirrorService
from app.ai.deps import get_mirror_service
from app.core.deps.auth import get_current_user
from app.core.deps.database import get_db
from app.auth.db.models import User
from app.core.logging import get_logger

logger = get_logger(__name__)

# Router prefix is set in main.py, routes here are relative to /mirror
router = APIRouter(prefix="/mirror", tags=["mirror"])


@router.get(
    "/reflection",
    response_model=MirrorReflectionResponse,
    summary="Generate a daily mirror reflection",
    dependencies=[Depends(get_db)]
)
async def get_mirror_reflection(
    mode: Annotated[
        Optional[str], 
        Query(
            description="Reflection mode: emotional, cognitive, behavioral, or relational"
        )
    ] = None,
    current_user: User = Depends(get_current_user),
    service: MirrorService = Depends(get_mirror_service)
) -> MirrorReflectionResponse:
    """
    Generate a personalized daily reflection based on recent journal entries.
    
    The mirror provides different types of insights based on the selected mode:
    - **emotional**: Focus on feelings and emotional patterns
    - **cognitive**: Focus on thinking patterns and beliefs
    - **behavioral**: Focus on actions and habits
    - **relational**: Focus on relationships and connections
    
    If no mode is specified, defaults to 'emotional'.
    """
    logger.info("mirror_reflection_request", user_id=str(current_user.id), mode=mode)
    
    try:
        result = await service.generate_reflection(
            user_id=str(current_user.id),
            mode=mode
        )
        logger.info("mirror_reflection_success", user_id=str(current_user.id), mode=result.get("mode"))
        return MirrorReflectionResponse(**result)
    except ValueError as e:
        logger.error("mirror_reflection_value_error", user_id=str(current_user.id), error=str(e))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error("mirror_reflection_error", user_id=str(current_user.id), error=str(e), error_type=type(e).__name__)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate reflection: {str(e)}"
        )
