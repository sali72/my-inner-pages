from typing import Optional
from app.memory.db.models import UserModel
from app.journals.db.models import Journal
from app.core.logging import get_logger

logger = get_logger(__name__)


def format_user_model_xml(user_model: Optional[UserModel]) -> str:
    if user_model is None:
        return "<user_model>\n  <status>no model available</status>\n</user_model>"

    parts = [f"  <version>{user_model.version}</version>"]

    if user_model.baseline.emotionalTone:
        parts.append(f"  <emotionalTone>{_escape_xml(user_model.baseline.emotionalTone)}</emotionalTone>")
    if user_model.baseline.thinkingStyle:
        parts.append(f"  <thinkingStyle>{_escape_xml(user_model.baseline.thinkingStyle)}</thinkingStyle>")
    if user_model.baseline.selfFocus:
        parts.append(f"  <selfFocus>{_escape_xml(user_model.baseline.selfFocus)}</selfFocus>")

    if user_model.patterns:
        pattern_lines = []
        for p in user_model.patterns:
            pattern_lines.append(f"    <pattern>{_escape_xml(p.description)}</pattern>")
        parts.append("  <patterns>\n" + "\n".join(pattern_lines) + "\n  </patterns>")

    if user_model.activeThemes:
        theme_lines = [f"    <theme>{_escape_xml(t)}</theme>" for t in user_model.activeThemes]
        parts.append("  <activeThemes>\n" + "\n".join(theme_lines) + "\n  </activeThemes>")

    if user_model.conversationGuidelines:
        guideline_lines = [f"    <guideline>{_escape_xml(g)}</guideline>" for g in user_model.conversationGuidelines]
        parts.append("  <conversationGuidelines>\n" + "\n".join(guideline_lines) + "\n  </conversationGuidelines>")

    body = "\n".join(parts)
    return f"<user_model>\n{body}\n</user_model>"


def format_journal_entries_xml(entries: list[Journal]) -> str:
    if not entries:
        return "<recent_entries>\n  <status>no entries yet</status>\n</recent_entries>"

    entry_parts = []
    for i, entry in enumerate(entries, 1):
        date_str = entry.created_at.strftime("%Y-%m-%d") if entry.created_at else "unknown"
        tags = ", ".join(entry.tags) if entry.tags else ""
        entry_parts.append(
            f"  <entry index=\"{i}\">\n"
            f"    <date>{date_str}</date>\n"
            f"    <title>{_escape_xml(entry.title)}</title>\n"
            f"    <content>{_escape_xml(entry.content)}</content>\n"
            f"    <tags>{_escape_xml(tags)}</tags>\n"
            f"  </entry>"
        )

    body = "\n".join(entry_parts)
    return f"<recent_entries>\n{body}\n</recent_entries>"


def format_chat_history_xml(history: list[dict]) -> str:
    if not history:
        return "<chat_history>\n  <status>no prior conversation</status>\n</chat_history>"

    msg_parts = []
    for msg in history:
        role_label = "user" if msg.get("role") == "user" else "assistant"
        content = _escape_xml(msg.get("content", ""))
        msg_parts.append(f"  <message role=\"{role_label}\">{content}</message>")

    body = "\n".join(msg_parts)
    return f"<chat_history>\n{body}\n</chat_history>"


def build_injected_context(
    user_model: Optional[UserModel],
    recent_entries: list[Journal],
    chat_history: Optional[list[dict]] = None
) -> str:
    parts = [
        format_user_model_xml(user_model),
        format_journal_entries_xml(recent_entries),
    ]

    if chat_history is not None:
        parts.append(format_chat_history_xml(chat_history))

    context = "\n\n".join(parts)
    logger.info(
        "injected_context_built",
        context_length=len(context),
        has_user_model=user_model is not None,
        entry_count=len(recent_entries),
        has_history=bool(chat_history),
    )
    return context


def _escape_xml(text: str) -> str:
    if not text:
        return ""
    text = text.replace("&", "&amp;")
    text = text.replace("<", "&lt;")
    text = text.replace(">", "&gt;")
    text = text.replace('"', "&quot;")
    text = text.replace("'", "&apos;")
    return text
