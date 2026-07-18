from datetime import datetime, timezone
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from pydantic import BaseModel, Field

from app.feedback.api.v0.schemas.request import CreateFeedbackRequest
from app.feedback.api.v0.schemas.response import (
    FeedbackResponse,
    FeedbackListResponse,
    FeedbackSummaryResponse,
    QuestionDistribution,
)
from app.feedback.db.models import Feedback
from app.feedback.config import FeedbackRoutes, QUESTIONNAIRE_VERSION
from app.auth.db.models import User
from app.auth.deps import get_current_user, get_current_admin_user
from app.core.rate_limit import limiter
from app.core.deps.settings import get_settings
from app.journals.db.models import Journal


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
) -> FeedbackResponse:
    settings = get_settings()
    entry_count = await Journal.find({"user_id": str(current_user.id)}).count()
    created_at = current_user.created_at
    if created_at is not None and created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    days_since_signup = (datetime.now(timezone.utc) - created_at).days if created_at else 0
    context = body.context.model_dump()
    context["entry_count"] = entry_count
    context["days_since_signup"] = days_since_signup
    feedback = Feedback(
        user_id=str(current_user.id),
        variant=body.variant,
        trigger=body.trigger,
        answers=body.answers,
        context=context,
        questionnaire_version=body.questionnaire_version or QUESTIONNAIRE_VERSION,
        app_version=settings.app_version,
    )
    await feedback.insert()
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
) -> FeedbackListResponse:
    query = {}
    if variant:
        query["variant"] = variant
    if trigger:
        query["trigger"] = trigger

    total = await Feedback.find(query).count()
    skip = (page - 1) * page_size
    items = (
        await Feedback.find(query)
        .sort(-Feedback.created_at)
        .skip(skip)
        .limit(page_size)
        .to_list()
    )

    return FeedbackListResponse.create(items=items, total=total, page=page, page_size=page_size)


@router.get(
    FeedbackRoutes.SUMMARY,
    response_model=FeedbackSummaryResponse,
    summary="Feedback summary (admin only)",
)
async def feedback_summary(
    current_user: User = Depends(get_current_admin_user),
) -> FeedbackSummaryResponse:
    all_feedback = await Feedback.find({}).to_list()
    total = len(all_feedback)

    by_variant: dict[str, int] = {}
    by_trigger: dict[str, int] = {}
    feel_values: list[int] = []
    question_options: dict[str, dict[str, int]] = {}
    headline: dict[str, dict[str, int]] = {
        "would_use_free": {},
        "would_pay": {},
    }

    for fb in all_feedback:
        by_variant[fb.variant] = by_variant.get(fb.variant, 0) + 1
        by_trigger[fb.trigger] = by_trigger.get(fb.trigger, 0) + 1

        feel = fb.answers.get("overall_feel")
        if isinstance(feel, (int, float)):
            feel_values.append(int(feel))

        for qid, answer in fb.answers.items():
            if qid == "overall_feel":
                continue
            if qid in ("would_use_free", "would_pay"):
                if isinstance(answer, str):
                    headline[qid][answer] = headline[qid].get(answer, 0) + 1
                continue
            if isinstance(answer, str):
                if qid not in question_options:
                    question_options[qid] = {}
                question_options[qid][answer] = question_options[qid].get(answer, 0) + 1
            elif isinstance(answer, list):
                for opt in answer:
                    if isinstance(opt, str):
                        if qid not in question_options:
                            question_options[qid] = {}
                        question_options[qid][opt] = question_options[qid].get(opt, 0) + 1

    distributions: dict[str, list[QuestionDistribution]] = {}
    for qid, opts in question_options.items():
        distributions[qid] = [
            QuestionDistribution(question_id=qid, label=opt, count=cnt)
            for opt, cnt in sorted(opts.items(), key=lambda x: -x[1])
        ]

    return FeedbackSummaryResponse(
        total_responses=total,
        by_variant=by_variant,
        by_trigger=by_trigger,
        average_overall_feel=(sum(feel_values) / len(feel_values)) if feel_values else None,
        question_distributions=distributions,
        headline_counts=headline,
    )
