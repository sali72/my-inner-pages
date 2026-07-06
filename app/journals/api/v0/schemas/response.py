from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict, field_serializer


class JournalResponse(BaseModel):
    """Response schema for a single journal entry."""
    
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "title": "My First Journal Entry",
                "content": "Today was a great day for reflection...",
                "tags": ["personal", "reflection"],
                "created_at": "2024-01-15T10:30:00Z",
                "updated_at": "2024-01-15T10:30:00Z"
            }
        }
    )
    
    id: str = Field(..., description="Journal ID")
    title: str = Field(..., description="Journal title")
    content: str = Field(..., description="Journal content")
    tags: list[str] = Field(default_factory=list, description="Journal tags")
    rumination_index: Optional[float] = Field(
        default=None, description="Real-time rumination signal (0-1)"
    )
    
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    
    @field_serializer('created_at', 'updated_at')
    def serialize_datetime(self, v: datetime) -> str:
        if v.tzinfo is None:
            return v.isoformat() + 'Z'
        return v.isoformat()
    
    @classmethod
    def from_document(cls, journal) -> "JournalResponse":
        """Create response from Journal document."""
        return cls(
            id=str(journal.id),
            title=journal.title,
            content=journal.content,
            tags=journal.tags,
            rumination_index=journal.rumination_index,
            created_at=journal.created_at,
            updated_at=journal.updated_at
        )


class JournalListResponse(BaseModel):
    """Response schema for paginated journal list."""
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "items": [
                    {
                        "id": "507f1f77bcf86cd799439011",
                        "title": "My First Journal",
                        "content": "Content here...",
                        "tags": ["personal"],
                        "created_at": "2024-01-15T10:30:00Z",
                        "updated_at": "2024-01-15T10:30:00Z"
                    }
                ],
                "total": 42,
                "page": 1,
                "page_size": 20,
                "total_pages": 3
            }
        }
    )
    
    items: list[JournalResponse] = Field(..., description="List of journals")
    total: int = Field(..., description="Total number of journals")
    page: int = Field(..., description="Current page number")
    page_size: int = Field(..., description="Items per page")
    total_pages: int = Field(..., description="Total number of pages")
    
    @classmethod
    def create(
        cls,
        journals: list,
        total: int,
        page: int,
        page_size: int
    ) -> "JournalListResponse":
        """Create paginated response from journals list."""
        total_pages = (total + page_size - 1) // page_size if page_size > 0 else 0
        
        return cls(
            items=[JournalResponse.from_document(j) for j in journals],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )


class MessageResponse(BaseModel):
    """Generic message response."""
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "message": "Journal deleted successfully"
            }
        }
    )
    
    message: str = Field(..., description="Response message")
