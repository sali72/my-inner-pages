from datetime import datetime
from typing import Optional
from beanie import Document
from pydantic import Field


class Journal(Document):
    """Journal document model for MongoDB."""
    
    title: str = Field(..., max_length=200)
    content: str = Field(..., max_length=50000)
    tags: list[str] = Field(default_factory=list)
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_deleted: bool = Field(default=False)
    deleted_at: Optional[datetime] = None
    
    class Settings:
        name = "journals"
        indexes = [
            "created_at",
            "is_deleted",
            [("is_deleted", 1), ("created_at", -1)],
        ]
    
    class Config:
        json_schema_extra = {
            "example": {
                "title": "My First Journal Entry",
                "content": "Today was a great day for reflection...",
                "tags": ["personal", "reflection"]
            }
        }
    
    def soft_delete(self) -> None:
        """Mark the journal as deleted without removing from database."""
        self.is_deleted = True
        self.deleted_at = datetime.utcnow()
    
    def restore(self) -> None:
        """Restore a soft-deleted journal."""
        self.is_deleted = False
        self.deleted_at = None
