from fastapi import APIRouter, HTTPException, status, Query, Depends
from typing import Annotated

from app.journals.api.v0.schemas.request import CreateJournalRequest, UpdateJournalRequest
from app.journals.api.v0.schemas.response import (
    JournalResponse,
    JournalListResponse,
    MessageResponse
)
from app.journals.facade.journal_facade import JournalFacade
from app.journals.deps import get_journal_facade
from app.core.deps.auth import get_current_user
from app.core.deps.database import get_db
from app.auth.db.models import User


# Router prefix is set in main.py, routes here are relative to /journals
router = APIRouter(prefix="/journals", tags=["journals"])


@router.post(
    "",
    response_model=JournalResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new journal entry",
    dependencies=[Depends(get_db)]
)
async def create_journal(
    request: CreateJournalRequest,
    current_user: User = Depends(get_current_user),
    facade: JournalFacade = Depends(get_journal_facade)
) -> JournalResponse:
    """
    Create a new journal entry for the authenticated user.
    
    - **title**: Journal title (required, max 200 chars)
    - **content**: Journal content (required, max 50000 chars)
    - **tags**: Optional list of tags for categorization
    """
    try:
        journal = await facade.create_journal(
            user_id=str(current_user.id),
            title=request.title,
            content=request.content,
            tags=request.tags
        )
        return JournalResponse.from_document(journal)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get(
    "",
    response_model=JournalListResponse,
    summary="List all journal entries",
    dependencies=[Depends(get_db)]
)
async def list_journals(
    page: Annotated[int, Query(ge=1, description="Page number")] = 1,
    page_size: Annotated[int, Query(ge=1, le=100, description="Items per page")] = 20,
    current_user: User = Depends(get_current_user),
    facade: JournalFacade = Depends(get_journal_facade)
) -> JournalListResponse:
    """
    List journal entries for the authenticated user with pagination.
    
    - **page**: Page number (default: 1)
    - **page_size**: Items per page (default: 20, max: 100)
    """
    journals, total = await facade.list_journals(
        user_id=str(current_user.id),
        page=page,
        page_size=page_size
    )
    
    return JournalListResponse.create(
        journals=journals,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get(
    "/{journal_id}",
    response_model=JournalResponse,
    summary="Get a specific journal entry",
    dependencies=[Depends(get_db)]
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
    "/{journal_id}",
    response_model=JournalResponse,
    summary="Update a journal entry",
    dependencies=[Depends(get_db)]
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
            tags=request.tags
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
    "/{journal_id}",
    response_model=MessageResponse,
    summary="Delete a journal entry",
    dependencies=[Depends(get_db)]
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
