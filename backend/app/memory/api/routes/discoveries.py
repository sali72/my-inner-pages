from fastapi import APIRouter, Depends
from app.auth.deps import get_current_user
from app.auth.db.models import User
from app.memory.deps import get_user_model_repository
from app.memory.db.repository import UserModelRepository
from app.journals.deps import get_journal_repository
from app.journals.db.repository import JournalRepository
from app.memory.api.schemas.discoveries import (
    DiscoveriesResponse,
    JourneyStateResponse,
    PatternCardResponse,
    PatternExcerptResponse,
    MomentItemResponse,
)

router = APIRouter(prefix="/discoveries", tags=["discoveries"])


@router.get("", response_model=DiscoveriesResponse, summary="Get Discoveries view payload")
async def get_discoveries(
    current_user: User = Depends(get_current_user),
    user_model_repo: UserModelRepository = Depends(get_user_model_repository),
    journal_repo: JournalRepository = Depends(get_journal_repository),
) -> DiscoveriesResponse:
    user_id = str(current_user.id)
    user_model = await user_model_repo.find_by_user_id(user_id)

    total_entries = await journal_repo.count_by_user(user_id)
    first_journal = await journal_repo.find_first_by_user(user_id)
    latest_journal = await journal_repo.find_latest_by_user(user_id)

    first_entry_date = (
        first_journal.created_at.strftime("%Y-%m-%d")
        if first_journal and first_journal.created_at
        else None
    )
    last_entry_date = (
        latest_journal.created_at.strftime("%Y-%m-%d")
        if latest_journal and latest_journal.created_at
        else None
    )

    total_words = 0
    if total_entries > 0:
        journals, _ = await journal_repo.find_all_by_user(user_id, limit=10000)
        total_words = sum(len((j.content_text or "").split()) for j in journals)


    has_model_output = user_model is not None and (
        len(user_model.patterns) > 0
        or bool(user_model.baseline.emotionalTone or user_model.baseline.thinkingStyle)
    )

    journey_status = "active" if has_model_output else "empty"
    model_version = user_model.version if user_model else 0
    last_model_update = (
        user_model.updatedAt.isoformat()
        if (user_model and user_model.updatedAt)
        else None
    )

    journey = JourneyStateResponse(
        status=journey_status,
        totalEntries=total_entries,
        totalWords=total_words,
        firstEntryDate=first_entry_date,
        lastEntryDate=last_entry_date,
        lastModelUpdate=last_model_update,
        modelVersion=model_version,
    )

    patterns_response: list[PatternCardResponse] = []
    active_themes: list[str] = []
    moments: list[MomentItemResponse] = []

    if first_journal and first_journal.created_at:
        moments.append(
            MomentItemResponse(
                id="first_entry",
                type="first_entry",
                date=first_journal.created_at.strftime("%Y-%m-%d"),
                title="You began your journal",
                description="Your sanctuary journey began with your first entry.",
            )
        )

    if user_model:
        active_themes = user_model.activeThemes

        for idx, p in enumerate(user_model.patterns):
            excerpts_resp = [
                PatternExcerptResponse(
                    entryId=exc.entry_id,
                    quote=exc.quote,
                    entryDate=exc.entry_date,
                )
                for exc in p.source_excerpts
            ]
            patterns_response.append(
                PatternCardResponse(
                    id=f"pattern_{idx}_{model_version}",
                    description=p.description,
                    evidence=p.evidence,
                    excerpts=excerpts_resp,
                )
            )

        if user_model.createdAt:
            moments.append(
                MomentItemResponse(
                    id=f"baseline_ready_{user_model.version}",
                    type="baseline_ready",
                    date=user_model.createdAt.strftime("%Y-%m-%d"),
                    title="Your first baseline reading formed",
                    description="Patterns and reflections began emerging from your practice.",
                )
            )

    moments.sort(key=lambda m: m.date)

    return DiscoveriesResponse(
        status="ok",
        journey=journey,
        patterns=patterns_response,
        activeThemes=active_themes,
        moments=moments,
    )
