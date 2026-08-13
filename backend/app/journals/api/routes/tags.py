from typing import Annotated, Optional
from fastapi import APIRouter, HTTPException, Query, Depends, status

from app.journals.api.schemas.tag_schemas import (
    TagListResponse,
    TagResponse,
    RenameTagRequest,
    UpdateTagRequest,
)
from app.journals.api.schemas.response import MessageResponse
from app.journals.db.tag_repository import TagRepository
from app.journals.deps import get_tag_repository
from app.auth.deps import get_current_user
from app.auth.db.models import User
from app.core.exceptions import RepositoryException


router = APIRouter(prefix="/tags", tags=["tags"])


def _tag_to_response(tag) -> TagResponse:
    return TagResponse(
        name=tag.name,
        usage_count=tag.usage_count,
        color=tag.color,
    )


@router.get(
    "",
    response_model=TagListResponse,
    summary="List or search tags for autocomplete",
)
async def list_tags(
    q: Annotated[
        Optional[str],
        Query(description="Prefix search query for autocomplete"),
    ] = None,
    limit: Annotated[
        int,
        Query(ge=1, le=100, description="Maximum number of tags to return"),
    ] = 50,
    current_user: User = Depends(get_current_user),
    tag_repo: TagRepository = Depends(get_tag_repository),
) -> TagListResponse:
    tags = await tag_repo.list_tags(
        user_id=str(current_user.id),
        query=q,
        limit=limit,
    )
    return TagListResponse(
        tags=[_tag_to_response(t) for t in tags],
        total=len(tags),
    )


@router.get(
    "/all",
    response_model=TagListResponse,
    summary="Get all tags with usage counts",
)
async def get_all_tags(
    current_user: User = Depends(get_current_user),
    tag_repo: TagRepository = Depends(get_tag_repository),
) -> TagListResponse:
    tags = await tag_repo.get_all_tags(user_id=str(current_user.id))
    return TagListResponse(
        tags=[_tag_to_response(t) for t in tags],
        total=len(tags),
    )


@router.put(
    "/{name}",
    response_model=MessageResponse,
    summary="Rename a tag across all journals",
)
async def rename_tag(
    name: str,
    request: RenameTagRequest,
    current_user: User = Depends(get_current_user),
    tag_repo: TagRepository = Depends(get_tag_repository),
) -> MessageResponse:
    normalized_old = name.strip().lower()
    normalized_new = request.new_name.strip().lower()
    if not normalized_new:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New tag name cannot be empty",
        )
    try:
        await tag_repo.rename_tag(
            user_id=str(current_user.id),
            old_name=normalized_old,
            new_name=normalized_new,
        )
        return MessageResponse(
            message=f"Tag '{name}' renamed to '{normalized_new}'"
        )
    except ValueError as e:
        detail_msg = str(e)
        status_code = (
            status.HTTP_404_NOT_FOUND
            if "not found" in detail_msg.lower()
            else status.HTTP_400_BAD_REQUEST
        )
        raise HTTPException(
            status_code=status_code,
            detail=detail_msg,
        )


@router.patch(
    "/{name}",
    response_model=TagResponse,
    summary="Update tag metadata (color)",
)
async def update_tag(
    name: str,
    request: UpdateTagRequest,
    current_user: User = Depends(get_current_user),
    tag_repo: TagRepository = Depends(get_tag_repository),
) -> TagResponse:
    normalized = name.strip().lower()
    try:
        tag = await tag_repo.update_tag(
            user_id=str(current_user.id),
            name=normalized,
            color=request.color,
        )
        if not tag:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tag '{name}' not found",
            )
        return _tag_to_response(tag)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.delete(
    "/{name}",
    response_model=MessageResponse,
    summary="Delete a tag from all journals",
)
async def delete_tag(
    name: str,
    current_user: User = Depends(get_current_user),
    tag_repo: TagRepository = Depends(get_tag_repository),
) -> MessageResponse:
    normalized = name.strip().lower()
    await tag_repo.delete_tag(
        user_id=str(current_user.id),
        name=normalized,
    )
    return MessageResponse(message=f"Tag '{name}' deleted from all journals")
