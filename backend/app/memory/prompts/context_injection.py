import json
from typing import Optional
from app.memory.db.models import UserModel
from app.journals.db.models import Journal
from app.core.logging import get_logger

logger = get_logger(__name__)


def format_user_model_json(user_model: Optional[UserModel]) -> str:
    if user_model is None:
        return "--- user_model ---\nnull"

    data = {
        "version": user_model.version,
    }

    if user_model.baseline.emotionalTone:
        data["emotionalTone"] = user_model.baseline.emotionalTone
    if user_model.baseline.thinkingStyle:
        data["thinkingStyle"] = user_model.baseline.thinkingStyle
    if user_model.baseline.selfFocus:
        data["selfFocus"] = user_model.baseline.selfFocus

    if user_model.patterns:
        data["patterns"] = [p.model_dump() for p in user_model.patterns]
    if user_model.activeThemes:
        data["activeThemes"] = user_model.activeThemes
    if user_model.conversationGuidelines:
        data["conversationGuidelines"] = user_model.conversationGuidelines

    return f"--- user_model ---\n{json.dumps(data, indent=2)}"


def format_journal_entries_json(entries: list[Journal]) -> str:
    if not entries:
        return "--- recent_entries ---\n[]"

    entry_list = []
    for entry in entries:
        entry_list.append({
            "date": entry.created_at.strftime("%Y-%m-%d") if entry.created_at else "unknown",
            "title": entry.title,
            "content": entry.content_text,
            "tags": entry.tags or [],
        })

    return f"--- recent_entries ---\n{json.dumps(entry_list, indent=2, ensure_ascii=False)}"


def format_chat_history_json(history: list[dict]) -> str:
    if not history:
        return "--- chat_history ---\n[]"

    messages = []
    for msg in history:
        messages.append({
            "role": "user" if msg.get("role") == "user" else "assistant",
            "content": msg.get("content", ""),
        })

    return f"--- chat_history ---\n{json.dumps(messages, indent=2, ensure_ascii=False)}"


def build_injected_context(
    user_model: Optional[UserModel],
    recent_entries: list[Journal],
    chat_history: Optional[list[dict]] = None
) -> str:
    parts = [
        format_user_model_json(user_model),
        format_journal_entries_json(recent_entries),
    ]

    if chat_history is not None:
        parts.append(format_chat_history_json(chat_history))

    context = "\n\n".join(parts)
    logger.info(
        "injected_context_built",
        context_length=len(context),
        has_user_model=user_model is not None,
        entry_count=len(recent_entries),
        has_history=bool(chat_history),
    )
    return context
