from fastapi import APIRouter, HTTPException, status, Query
from typing import Annotated

from app.journals.api.v0.schemas.request import CreateJournalRequest, UpdateJournalRequest
from app.journals.api.v0.schemas.response import (
    JournalResponse,
    JournalListResponse,
    MessageResponse
)
from app.journals.facade.journal_facade import JournalFacade


router = APIRouter(prefix="/journals", tags=["journals"])


@router.post(
    "",
    response_model=JournalResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new journal entry"
)
async def create_journal(request: CreateJournalRequest) -> JournalResponse:
    """
    Create a new journal entry.
    
    - **title**: Journal title (required, max 200 chars)
    - **content**: Journal content (required, max 50000 chars)
    - **tags**: Optional list of tags for categorization
    """
    facade = JournalFacade()
    
    try:
        journal = await facade.create_journal(
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
    summary="List all journal entries"
)
async def list_journals(
    page: Annotated[int, Query(ge=1, description="Page number")] = 1,
    page_size: Annotated[int, Query(ge=1, le=100, description="Items per page")] = 20
) -> JournalListResponse:
    """
    List all journal entries with pagination.
    
    - **page**: Page number (default: 1)
    - **page_size**: Items per page (default: 20, max: 100)
    """
    facade = JournalFacade()
    
    journals, total = await facade.list_journals(page=page, page_size=page_size)
    
    return JournalListResponse.create(
        journals=journals,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get(
    "/{journal_id}",
    response_model=JournalResponse,
    summary="Get a specific journal entry"
)
async def get_journal(journal_id: str) -> JournalResponse:
    """
    Get a specific journal entry by ID.
    
    - **journal_id**: MongoDB ObjectId of the journal
    """
    facade = JournalFacade()
    
    journal = await facade.get_journal(journal_id)
    
    if not journal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Journal not found"
        )
    
    return JournalResponse.from_document(journal)


@router.put(
    "/{journal_id}",
    response_model=JournalResponse,
    summary="Update a journal entry"
)
async def update_journal(
    journal_id: str,
    request: UpdateJournalRequest
) -> JournalResponse:
    """
    Update an existing journal entry.
    
    - **journal_id**: MongoDB ObjectId of the journal
    - **title**: New title (optional)
    - **content**: New content (optional)
    - **tags**: New tags (optional)
    """
    facade = JournalFacade()
    
    try:
        journal = await facade.update_journal(
            journal_id=journal_id,
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
    summary="Delete a journal entry"
)
async def delete_journal(journal_id: str) -> MessageResponse:
    """
    Delete a journal entry (soft delete by default).
    
    - **journal_id**: MongoDB ObjectId of the journal
    """
    facade = JournalFacade()
    
    deleted = await facade.delete_journal(journal_id)
    
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Journal not found"
        )
    
    return MessageResponse(message="Journal deleted successfully")
