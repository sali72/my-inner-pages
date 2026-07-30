from typing import Annotated, Optional
from fastapi import APIRouter, BackgroundTasks, HTTPException, status, Query, Depends

from app.journals.api.schemas.request import CreateJournalRequest, UpdateJournalRequest
from app.journals.api.schemas.response import (
    JournalResponse,
    JournalListResponse,
    MessageResponse
)
from app.journals.facade.journal_facade import JournalFacade
from app.journals.deps import get_journal_facade
from app.memory.deps import get_user_model_updater
from app.memory.user_model_updater import UserModelUpdater, trigger_update_if_needed
from app.auth.deps import get_current_user
from app.auth.db.models import User
from app.journals.api.config import JournalRoutes


# Router prefix is set in main.py, routes here are relative to /journals
router = APIRouter(prefix="/journals", tags=["journals"])


@router.post(
    JournalRoutes.ROOT,
    response_model=JournalResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new journal entry",
)
async def create_journal(
    request: CreateJournalRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    facade: JournalFacade = Depends(get_journal_facade),
    updater: UserModelUpdater = Depends(get_user_model_updater),
) -> JournalResponse:
    """
    Create a new journal entry for the authenticated user.
    
    - **title**: Journal title (optional, max 200 chars)
    - **content**: Journal content (required, max 50000 chars)
    - **tags**: Optional list of tags for categorization
    """
    try:
        journal = await facade.create_journal(
            user_id=str(current_user.id),
            title=request.title,
            content=request.content,
            tags=request.tags,
            created_at=request.created_at,
        )
        background_tasks.add_task(trigger_update_if_needed, updater, str(current_user.id))
        return JournalResponse.from_document(journal)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get(
    JournalRoutes.ROOT,
    response_model=JournalListResponse,
    summary="List all journal entries",
)
async def list_journals(
    page_size: Annotated[int, Query(ge=1, le=100, description="Items per page")] = 20,
    cursor: Annotated[Optional[str], Query(description="Opaque cursor from previous page")] = None,
    tags: Annotated[Optional[list[str]], Query(description="Filter by tags")] = None,
    tag_mode: Annotated[str, Query(pattern="^(or|and)$", description="Tag filter mode: 'or' matches any tag, 'and' matches all tags")] = "or",
    current_user: User = Depends(get_current_user),
    facade: JournalFacade = Depends(get_journal_facade)
) -> JournalListResponse:
    """
    List journal entries for the authenticated user with cursor-based pagination.
    
    - **page_size**: Items per page (default: 20, max: 100)
    - **cursor**: Opaque cursor string from the previous page response (omit for first page)
    - **tags**: Filter by tags (repeatable: ?tags=growth&tags=personal)
    - **tag_mode**: 'or' (default) matches any tag, 'and' matches all tags
    """
    journals, next_cursor = await facade.list_journals(
        user_id=str(current_user.id),
        cursor=cursor,
        page_size=page_size,
        tags=tags,
        tag_mode=tag_mode,
    )
    
    return JournalListResponse.create(
        journals=journals,
        next_cursor=next_cursor,
    )


@router.get(
    JournalRoutes.BY_ID,
    response_model=JournalResponse,
    summary="Get a specific journal entry",
)
async def get_journal(
    journal_id: str,
    current_user: User = Depends(get_current_user),
    facade: JournalFacade = Depends(get_journal_facade)
) -> JournalResponse:
    """
    Get a specific journal entry by ID for the authenticated user.
    
    - **journal_id**: MongoDB ObjectId of the journal
    """
    journal = await facade.get_journal(journal_id, str(current_user.id))
    
    if not journal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Journal not found"
        )
    
    return JournalResponse.from_document(journal)


@router.put(
    JournalRoutes.BY_ID,
    response_model=JournalResponse,
    summary="Update a journal entry",
)
async def update_journal(
    journal_id: str,
    request: UpdateJournalRequest,
    current_user: User = Depends(get_current_user),
    facade: JournalFacade = Depends(get_journal_facade)
) -> JournalResponse:
    """
    Update an existing journal entry for the authenticated user.
    
    - **journal_id**: MongoDB ObjectId of the journal
    - **title**: New title (optional)
    - **content**: New content (optional)
    - **tags**: New tags (optional)
    """
    try:
        journal = await facade.update_journal(
            journal_id=journal_id,
            user_id=str(current_user.id),
            title=request.title,
            content=request.content,
            tags=request.tags,
            created_at=request.created_at,
        )
        
        if not journal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Journal not found"
            )
        
        return JournalResponse.from_document(journal)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete(
    JournalRoutes.BY_ID,
    response_model=MessageResponse,
    summary="Delete a journal entry",
)
async def delete_journal(
    journal_id: str,
    current_user: User = Depends(get_current_user),
    facade: JournalFacade = Depends(get_journal_facade)
) -> MessageResponse:
    """
    Delete a journal entry for the authenticated user.
    
    - **journal_id**: MongoDB ObjectId of the journal
    """
    deleted = await facade.delete_journal(journal_id, str(current_user.id))
    
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Journal not found"
        )
    
    return MessageResponse(message="Journal deleted successfully")
