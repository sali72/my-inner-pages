from datetime import datetime
from typing import Optional
from beanie import Document
from pydantic import Field


class Journal(Document):
    """Journal document model for MongoDB."""
    
    user_id: str = Field(..., description="User ID who owns this journal")
    title: str = Field(..., max_length=200)
    content: str = Field(..., max_length=50000)
    tags: list[str] = Field(default_factory=list)
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "journals"
        indexes = [
            "user_id",
            "created_at",
            [("user_id", 1), ("created_at", -1)],
        ]
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "507f1f77bcf86cd799439011",
                "title": "My First Journal Entry",
                "content": "Today was a great day for reflection...",
                "tags": ["personal", "reflection"]
            }
        }
