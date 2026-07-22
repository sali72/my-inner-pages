from datetime import datetime, timezone
from typing import Optional

from app.core.config import Settings
from app.core.logging import get_logger
from app.feedback.config import QUESTIONNAIRE_VERSION
from app.feedback.api.v0.schemas.request import CreateFeedbackRequest
from app.feedback.api.v0.schemas.response import (
    FeedbackListResponse,
    FeedbackResponse,
    FeedbackSummaryResponse,
    QuestionDistribution,
)
from app.feedback.db.models import Feedback
from app.journals.db.repository import JournalRepository

logger = get_logger(__name__)


class FeedbackFacade:
    def __init__(
        self,
        journal_repository: JournalRepository,
        settings: Settings,
    ):
        self.journal_repository = journal_repository
        self.settings = settings

    async def create_feedback(
        self,
        body: CreateFeedbackRequest,
        user_id: str,
        user_created_at: Optional[datetime],
    ) -> Feedback:
        entry_count = await self.journal_repository.count_by_user(user_id)

        created_at = user_created_at
        if created_at is not None and created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
        days_since_signup = (datetime.now(timezone.utc) - created_at).days if created_at else 0

        context = body.context.model_dump() if body.context else {}
        context["entry_count"] = entry_count
        context["days_since_signup"] = days_since_signup

        feedback = Feedback(
            user_id=user_id,
            variant=body.variant,
            trigger=body.trigger,
            answers=body.answers,
            context=context,
            questionnaire_version=body.questionnaire_version or QUESTIONNAIRE_VERSION,
            app_version=self.settings.app_version,
        )
        await feedback.insert()
        logger.info("feedback_created", user_id=user_id, variant=body.variant)
        return feedback

    async def list_feedback(
        self,
        page: int = 1,
        page_size: int = 50,
        variant: Optional[str] = None,
        trigger: Optional[str] = None,
    ) -> FeedbackListResponse:
        query = {}
        if variant:
            query["variant"] = variant
        if trigger:
            query["trigger"] = trigger

        total = await Feedback.find(query).count()
        skip = (page - 1) * page_size
        items = (
            await Feedback.find(query)
            .sort(-Feedback.created_at)
            .skip(skip)
            .limit(page_size)
            .to_list()
        )

        return FeedbackListResponse.create(items=items, total=total, page=page, page_size=page_size)

    async def feedback_summary(self) -> FeedbackSummaryResponse:
        all_feedback = await Feedback.find({}).to_list()
        total = len(all_feedback)

        by_variant: dict[str, int] = {}
        by_trigger: dict[str, int] = {}
        feel_values: list[int] = []
        question_options: dict[str, dict[str, int]] = {}
        headline: dict[str, dict[str, int]] = {
            "would_use_free": {},
            "would_pay": {},
        }

        for fb in all_feedback:
            by_variant[fb.variant] = by_variant.get(fb.variant, 0) + 1
            by_trigger[fb.trigger] = by_trigger.get(fb.trigger, 0) + 1

            feel = fb.answers.get("overall_feel")
            if isinstance(feel, (int, float)):
                feel_values.append(int(feel))

            for qid, answer in fb.answers.items():
                if qid == "overall_feel":
                    continue
                if qid in ("would_use_free", "would_pay"):
                    if isinstance(answer, str):
                        headline[qid][answer] = headline[qid].get(answer, 0) + 1
                    continue
                if isinstance(answer, str):
                    if qid not in question_options:
                        question_options[qid] = {}
                    question_options[qid][answer] = question_options[qid].get(answer, 0) + 1
                elif isinstance(answer, list):
                    for opt in answer:
                        if isinstance(opt, str):
                            if qid not in question_options:
                                question_options[qid] = {}
                            question_options[qid][opt] = question_options[qid].get(opt, 0) + 1

        distributions: dict[str, list[QuestionDistribution]] = {}
        for qid, opts in question_options.items():
            distributions[qid] = [
                QuestionDistribution(question_id=qid, label=opt, count=cnt)
                for opt, cnt in sorted(opts.items(), key=lambda x: -x[1])
            ]

        return FeedbackSummaryResponse(
            total_responses=total,
            by_variant=by_variant,
            by_trigger=by_trigger,
            average_overall_feel=(sum(feel_values) / len(feel_values)) if feel_values else None,
            question_distributions=distributions,
            headline_counts=headline,
        )
