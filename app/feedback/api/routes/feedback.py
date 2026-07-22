from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from pydantic import BaseModel, Field

from app.feedback.api.schemas.request import CreateFeedbackRequest
from app.feedback.api.schemas.response import (
    FeedbackResponse,
    FeedbackListResponse,
    FeedbackSummaryResponse,
)
from app.feedback.config import FeedbackRoutes
from app.feedback.deps import get_feedback_facade
from app.feedback.facade.feedback_facade import FeedbackFacade
from app.auth.db.models import User
from app.auth.deps import get_current_user, get_current_admin_user
from app.core.rate_limit import limiter


router = APIRouter(prefix="/feedback", tags=["feedback"])


class DismissTriggerRequest(BaseModel):
    trigger: str = Field(..., pattern="^(session_nudge|exit_intent)$")


@router.post(
    "/dismiss",
    status_code=status.HTTP_200_OK,
    summary="Dismiss a feedback trigger (mark as seen)",
)
async def dismiss_trigger(
    body: DismissTriggerRequest,
    current_user: User = Depends(get_current_user),
) -> dict:
    current_user.feedback_triggers[body.trigger] = True
    await current_user.save()
    return {"status": "ok"}


@router.post(
    FeedbackRoutes.ROOT,
    response_model=FeedbackResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit feedback",
)
@limiter.limit("5/minute")
async def create_feedback(
    request: Request,
    body: CreateFeedbackRequest,
    current_user: User = Depends(get_current_user),
    facade: FeedbackFacade = Depends(get_feedback_facade),
) -> FeedbackResponse:
    feedback = await facade.create_feedback(
        body=body,
        user_id=str(current_user.id),
        user_created_at=current_user.created_at,
    )
    return FeedbackResponse.from_document(feedback)


@router.get(
    FeedbackRoutes.ROOT,
    response_model=FeedbackListResponse,
    summary="List feedback (admin only)",
)
async def list_feedback(
    page: Annotated[int, Query(ge=1, description="Page number")] = 1,
    page_size: Annotated[int, Query(ge=1, le=100, description="Items per page")] = 50,
    variant: Annotated[Optional[str], Query(pattern="^(full|short)?$", description="Filter by variant")] = None,
    trigger: Annotated[Optional[str], Query(pattern="^(button|session_nudge|exit_intent)?$", description="Filter by trigger")] = None,
    current_user: User = Depends(get_current_admin_user),
    facade: FeedbackFacade = Depends(get_feedback_facade),
) -> FeedbackListResponse:
    return await facade.list_feedback(
        page=page,
        page_size=page_size,
        variant=variant,
        trigger=trigger,
    )


@router.get(
    FeedbackRoutes.SUMMARY,
    response_model=FeedbackSummaryResponse,
    summary="Feedback summary (admin only)",
)
async def feedback_summary(
    current_user: User = Depends(get_current_admin_user),
    facade: FeedbackFacade = Depends(get_feedback_facade),
) -> FeedbackSummaryResponse:
    return await facade.feedback_summary()
