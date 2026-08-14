from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, field_validator, ConfigDict


class CreateJournalRequest(BaseModel):
    """Request schema for creating a journal entry."""
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "title": "My First Journal Entry",
                "content_json": {
                    "type": "doc",
                    "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Today I learned about self-reflection..."}]}]
                },
                "tags": ["personal", "growth", "reflection"]
            }
        }
    )
    
    title: Optional[str] = Field(default=None, max_length=200, description="Journal title")
    content_json: Dict[str, Any] = Field(..., description="Journal Tiptap JSON document AST")
    tags: Optional[list[str]] = Field(default=None, description="Optional tags for categorization (max 20, max 50 chars each)")
    created_at: Optional[datetime] = Field(default=None, description="Override creation date")
    
    @field_validator("title")
    @classmethod
    def strip_whitespace(cls, v: Optional[str]) -> Optional[str]:
        """Strip leading/trailing whitespace."""
        return v.strip() if v else v


class UpdateJournalRequest(BaseModel):
    """Request schema for updating a journal entry."""
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "title": "Updated Journal Title",
                "content_json": {
                    "type": "doc",
                    "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Updated content with new insights..."}]}]
                },
                "tags": ["personal", "updated"]
            }
        }
    )
    
    title: Optional[str] = Field(None, max_length=200, description="Updated title")
    content_json: Optional[Dict[str, Any]] = Field(None, description="Updated journal Tiptap JSON document AST")
    tags: Optional[list[str]] = Field(None, description="Updated tags (max 20, max 50 chars each)")
    created_at: Optional[datetime] = Field(default=None, description="Override creation date")
    
    @field_validator("title")
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
