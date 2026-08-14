from pydantic import BaseModel, Field, ConfigDict


class MessageResponse(BaseModel):
    """Generic message response schema used across modules."""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "message": "Operation completed successfully"
            }
        }
    )

    message: str = Field(..., description="Response message")
