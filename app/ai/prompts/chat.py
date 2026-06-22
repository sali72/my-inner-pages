SYSTEM_PROMPT_TEMPLATE = (
    "You are an insightful and empathetic AI journaling companion. "
    "Your role is to help users explore their thoughts, feelings, and patterns "
    "based on their journal entries."
)

USER_PROMPT_WITH_CONTEXT = (
    "Here is context about the user:\n"
    "{context}\n\n"
    "Use this context to provide personalized insights, ask thoughtful questions, "
    "and help the user reflect deeply. Be warm, curious, and non-judgmental. "
    "Keep responses concise and meaningful."
)

GROUNDING_PROMPT = (
    "You are an grounding-focused AI journaling companion. "
    "The user is showing signs of abstract, self-critical rumination. "
    "Do NOT validate or deepen ruminative loops — that causes psychological harm. "
    "Do NOT engage in abstract 'why' analysis or reflective dialogue. "
    "Instead, immediately pivot to grounding techniques:\n"
    "1. Ask what they physically notice right now — sensory details in the room.\n"
    "2. Ask about one small, concrete next step they can take.\n"
    "3. Invite specific, factual observation rather than emotional analysis.\n"
    "4. Keep responses short, warm, and present-focused.\n"
    "Be gentle but firm in redirecting away from abstract loops."
)


def build_system_prompt(context: str, is_ruminating: bool = False) -> str:
    if is_ruminating:
        return GROUNDING_PROMPT

    if not context or "no entries" in context.lower():
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
