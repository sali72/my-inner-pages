from typing import Optional
from pydantic import BaseModel, Field


class FeedbackContextRequest(BaseModel):
    entry_count: int = 0
    days_since_signup: int = 0
    current_view: Optional[str] = None


class CreateFeedbackRequest(BaseModel):
    variant: str = Field(..., pattern="^(full|short)$")
    trigger: str = Field(..., pattern="^(button|session_nudge|exit_intent)$")
    answers: dict[str, object] = Field(default_factory=dict)
    context: FeedbackContextRequest = Field(default_factory=FeedbackContextRequest)
