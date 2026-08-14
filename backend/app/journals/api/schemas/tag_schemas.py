import re
from typing import Optional
from pydantic import BaseModel, Field, field_validator, ConfigDict


def normalize_tag(name: str) -> str:
    """
    Normalize tag name into canonical kebab-case format.
    Example: ' Self Care ' -> 'self-care'
    """
    if not name:
        return ""
    return re.sub(r"\s+", "-", name.strip().lower()).lstrip("#")


class TagResponse(BaseModel):
    name: str = Field(..., description="Normalized tag name")
    usage_count: int = Field(..., ge=0, description="Number of journals using this tag")
    color: Optional[str] = Field(default=None, description="Hex color for the tag")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "personal",
                "usage_count": 5,
                "color": "#e74c3c",
            }
        }
    )


class TagListResponse(BaseModel):
    tags: list[TagResponse] = Field(..., description="List of tags")
    total: int = Field(..., description="Total number of tags")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "tags": [
                    {"name": "growth", "usage_count": 3},
                    {"name": "personal", "usage_count": 5},
                ],
                "total": 2,
            }
        }
    )


class RenameTagRequest(BaseModel):
    new_name: str = Field(
        ..., min_length=1, max_length=50, description="New tag name"
    )

    @field_validator("new_name")
    @classmethod
    def normalize(cls, v: str) -> str:
        normalized = normalize_tag(v)
        if not normalized:
            raise ValueError("Tag name cannot be empty")
        return normalized


class UpdateTagRequest(BaseModel):
    color: Optional[str] = Field(
        default=None, description="Hex color for the tag"
    )

    @field_validator("color")
    @classmethod
    def validate_color(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            import re
            if not re.match(r'^#[0-9a-fA-F]{6}$', v):
                raise ValueError("Color must be a valid hex color (e.g. #e74c3c)")
        return v
