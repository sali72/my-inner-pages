SYSTEM_PROMPT_TEMPLATE = (
    "You are an insightful and empathetic AI journaling companion. "
    "Your role is to help users explore their thoughts, feelings, and patterns "
    "based on their journal entries."
)


USER_PROMPT_WITH_CONTEXT = (
    "Here are the user's recent journal entries for context:\n"
    "{context}\n\n"
    "Use these entries to provide personalized insights, ask thoughtful questions, "
    "and help the user reflect deeply. Be warm, curious, and non-judgmental. "
    "Keep responses concise and meaningful."
)


def build_system_prompt(context: str) -> str:
    if "No journal entries available yet." in context:
        return SYSTEM_PROMPT_TEMPLATE
    return f"{SYSTEM_PROMPT_TEMPLATE}\n\n{USER_PROMPT_WITH_CONTEXT.format(context=context)}"


def format_conversation_prompt(user_message: str, history: list[dict]) -> str:
    if not history:
        return user_message

    parts = ["Previous conversation:"]
    for msg in history:
        role_label = "User" if msg["role"] == "user" else "Assistant"
        parts.append(f"{role_label}: {msg['content']}")

    parts.extend(["", "Current message:", f"User: {user_message}"])
    return "\n".join(parts)
