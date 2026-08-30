from typing import Optional
from pydantic import BaseModel, Field


class PatternExcerptResponse(BaseModel):
    entryId: str
    quote: str
    entryDate: Optional[str] = None


class PatternCardResponse(BaseModel):
    id: str
    description: str
    evidence: str
    excerpts: list[PatternExcerptResponse] = Field(default_factory=list)


class JourneyStateResponse(BaseModel):
    status: str = Field(..., description="'empty' (before model output) or 'active' (after model output)")
    totalEntries: int = 0
    totalWords: int = 0
    firstEntryDate: Optional[str] = None
    lastEntryDate: Optional[str] = None
    lastModelUpdate: Optional[str] = None
    modelVersion: int = 0


class MomentItemResponse(BaseModel):
    id: str
    type: str = Field(..., description="Moment type: 'first_entry', 'baseline_ready', 'model_update'")
    date: str
    title: str
    description: str


class DiscoveriesResponse(BaseModel):
    status: str = "ok"
    journey: JourneyStateResponse
    patterns: list[PatternCardResponse] = Field(default_factory=list)
    activeThemes: list[str] = Field(default_factory=list)
    moments: list[MomentItemResponse] = Field(default_factory=list)
