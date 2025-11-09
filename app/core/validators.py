"""Validation utilities."""
from beanie import PydanticObjectId
from fastapi import HTTPException, status
from app.core.logging import get_logger

logger = get_logger(__name__)


def validate_object_id(id_string: str, field_name: str = "id") -> PydanticObjectId:
    """
    Validate and convert string to PydanticObjectId.
    
    Args:
        id_string: String to convert
        field_name: Name of the field (for error messages)
        
    Returns:
        Valid PydanticObjectId
        
    Raises:
        HTTPException: If string is not a valid ObjectId
    """
    try:
        return PydanticObjectId(id_string)
    except Exception as e:
        logger.warning(
            "invalid_object_id",
            id_string=id_string,
            field_name=field_name,
            error=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid {field_name}: '{id_string}' is not a valid ObjectId"
        )
