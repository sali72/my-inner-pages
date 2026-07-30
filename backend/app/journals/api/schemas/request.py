from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, field_validator, ConfigDict


class CreateJournalRequest(BaseModel):
    """Request schema for creating a journal entry."""
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "title": "My First Journal Entry",
                "content": "Today I learned about the importance of self-reflection...",
                "tags": ["personal", "growth", "reflection"]
            }
        }
    )
    
    title: Optional[str] = Field(default=None, max_length=200, description="Journal title")
    content: str = Field(..., max_length=50000, description="Journal content")
    tags: Optional[list[str]] = Field(default=None, description="Optional tags for categorization (max 20, max 50 chars each)")
    created_at: Optional[datetime] = Field(default=None, description="Override creation date")
    
    @field_validator("title", "content")
    @classmethod
    def strip_whitespace(cls, v: Optional[str]) -> Optional[str]:
        """Strip leading/trailing whitespace."""
        return v.strip() if v else v
    
    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v: Optional[list[str]]) -> Optional[list[str]]:
        if v is None:
            return v
        if len(v) > 20:
            raise ValueError("Maximum 20 tags allowed")
        import re
        for tag in v:
            stripped = tag.strip()
            if not stripped:
                continue
            if len(stripped) > 50:
                raise ValueError(f"Tag exceeds maximum length of 50 characters: '{stripped[:30]}...'")
            if not re.match(r'^[\w\s-]+$', stripped):
                raise ValueError(
                    f"Tag '{stripped}' contains invalid characters. "
                    "Only letters, numbers, spaces, underscores, and hyphens are allowed."
                )
        return v


class UpdateJournalRequest(BaseModel):
    """Request schema for updating a journal entry."""
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "title": "Updated Journal Title",
                "content": "Updated content with new insights...",
                "tags": ["personal", "updated"]
            }
        }
    )
    
    title: Optional[str] = Field(None, max_length=200, description="Updated title")
    content: Optional[str] = Field(None, max_length=50000, description="Updated content")
    tags: Optional[list[str]] = Field(None, description="Updated tags (max 20, max 50 chars each)")
    created_at: Optional[datetime] = Field(default=None, description="Override creation date")
    
    @field_validator("title", "content")
    @classmethod
    def strip_whitespace(cls, v: Optional[str]) -> Optional[str]:
        """Strip leading/trailing whitespace if provided."""
        return v.strip() if v else v
    
    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v: Optional[list[str]]) -> Optional[list[str]]:
        if v is None:
            return v
        if len(v) > 20:
            raise ValueError("Maximum 20 tags allowed")
        import re
        for tag in v:
            stripped = tag.strip()
            if not stripped:
                continue
            if len(stripped) > 50:
                raise ValueError(f"Tag exceeds maximum length of 50 characters: '{stripped[:30]}...'")
            if not re.match(r'^[\w\s-]+$', stripped):
                raise ValueError(
                    f"Tag '{stripped}' contains invalid characters. "
                    "Only letters, numbers, spaces, underscores, and hyphens are allowed."
                )
        return v


class PaginationParams(BaseModel):
    """Pagination parameters for list endpoints."""
    
    page: int = Field(default=1, ge=1, description="Page number (1-indexed)")
    page_size: int = Field(default=20, ge=1, le=100, description="Items per page")
