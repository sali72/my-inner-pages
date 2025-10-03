from typing import Optional
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
    
    title: str = Field(..., min_length=1, max_length=200, description="Journal title")
    content: str = Field(..., min_length=1, max_length=50000, description="Journal content")
    tags: Optional[list[str]] = Field(default=None, description="Optional tags for categorization")
    
    @field_validator("title", "content")
    @classmethod
    def strip_whitespace(cls, v: str) -> str:
        """Strip leading/trailing whitespace."""
        return v.strip()


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
    
    title: Optional[str] = Field(None, min_length=1, max_length=200, description="Updated title")
    content: Optional[str] = Field(None, min_length=1, max_length=50000, description="Updated content")
    tags: Optional[list[str]] = Field(None, description="Updated tags")
    
    @field_validator("title", "content")
    @classmethod
    def strip_whitespace(cls, v: Optional[str]) -> Optional[str]:
        """Strip leading/trailing whitespace if provided."""
        return v.strip() if v else v


class PaginationParams(BaseModel):
    """Pagination parameters for list endpoints."""
    
    page: int = Field(default=1, ge=1, description="Page number (1-indexed)")
    page_size: int = Field(default=20, ge=1, le=100, description="Items per page")
