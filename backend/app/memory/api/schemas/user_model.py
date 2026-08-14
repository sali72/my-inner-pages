from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, Field, ConfigDict


class UserModelStatsSchema(BaseModel):
    totalEntries: int = Field(default=0)
    totalWords: int = Field(default=0)


class UserModelUpdateStatusResponse(BaseModel):
    status: str = Field(default="ok")
    version: int = Field(...)
    updatedAt: Optional[str] = Field(default=None)
    stats: UserModelStatsSchema = Field(...)
    patterns: int = Field(...)
    activeThemes: int = Field(...)
    conversationGuidelines: int = Field(...)


class UserModelDetailResponse(BaseModel):
    status: str = Field(default="ok")
    version: int = Field(...)
    updatedAt: Optional[str] = Field(default=None)
    createdAt: Optional[str] = Field(default=None)
    stats: dict[str, Any] = Field(default_factory=dict)
    baseline: dict[str, Any] = Field(default_factory=dict)
    patterns: list[dict[str, Any]] = Field(default_factory=list)
    activeThemes: list[str] = Field(default_factory=list)
    conversationGuidelines: list[str] = Field(default_factory=list)
