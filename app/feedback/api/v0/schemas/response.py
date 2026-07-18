from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class FeedbackContextResponse(BaseModel):
    entry_count: int = 0
    days_since_signup: int = 0
    current_view: Optional[str] = None


class FeedbackResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str = Field(..., description="Feedback ID")
    user_id: str = Field(..., description="User ID")
    variant: str = Field(..., description="'full' or 'short'")
    trigger: str = Field(..., description="Trigger type")
    answers: dict[str, object] = Field(default_factory=dict)
    context: FeedbackContextResponse = Field(default_factory=FeedbackContextResponse)
    created_at: datetime = Field(..., description="Submission timestamp")

    @classmethod
    def from_document(cls, feedback) -> "FeedbackResponse":
        return cls(
            id=str(feedback.id),
            user_id=feedback.user_id,
            variant=feedback.variant,
            trigger=feedback.trigger,
            answers=feedback.answers,
            context=FeedbackContextResponse(
                entry_count=feedback.context.entry_count,
                days_since_signup=feedback.context.days_since_signup,
                current_view=feedback.context.current_view,
            ),
            created_at=feedback.created_at,
        )


class FeedbackListResponse(BaseModel):
    items: list[FeedbackResponse] = Field(..., description="List of feedback responses")
    total: int = Field(..., description="Total count")
    page: int = Field(..., description="Current page")
    page_size: int = Field(..., description="Items per page")
    total_pages: int = Field(..., description="Total pages")

    @classmethod
    def create(cls, items: list, total: int, page: int, page_size: int) -> "FeedbackListResponse":
        total_pages = (total + page_size - 1) // page_size if page_size > 0 else 0
        return cls(
            items=[FeedbackResponse.from_document(f) for f in items],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )


class QuestionDistribution(BaseModel):
    question_id: str
    label: str
    count: int


class FeedbackSummaryResponse(BaseModel):
    total_responses: int = 0
    by_variant: dict[str, int] = Field(default_factory=dict)
    by_trigger: dict[str, int] = Field(default_factory=dict)
    average_overall_feel: Optional[float] = None
    question_distributions: dict[str, list[QuestionDistribution]] = Field(default_factory=dict)
    headline_counts: dict[str, dict[str, int]] = Field(default_factory=dict)
