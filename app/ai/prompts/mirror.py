from langchain_core.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from langchain_core.output_parsers import StrOutputParser


# System prompts for each reflection mode
SYSTEM_PROMPTS = {
    "emotional": (
        "You are a compassionate reflection companion for a journaling app. "
        "Your role is to provide brief, emotionally aware insights based on the user's recent journal entries. "
        "Focus on emotional patterns, feelings, and inner experiences. "
        "Be warm, empathetic, and encouraging. Keep responses under 100 words. "
        "Avoid being prescriptive or giving direct advice. Instead, reflect back what you notice."
    ),
    "cognitive": (
        "You are a thoughtful reflection companion for a journaling app. "
        "Your role is to provide brief insights about thinking patterns, beliefs, and perspectives "
        "based on the user's recent journal entries. "
        "Focus on cognitive patterns, assumptions, and ways of thinking. "
        "Be curious and thought-provoking. Keep responses under 100 words. "
        "Help the user see their thoughts from a new angle."
    ),
    "behavioral": (
        "You are an observant reflection companion for a journaling app. "
        "Your role is to provide brief insights about actions, habits, and behaviors "
        "based on the user's recent journal entries. "
        "Focus on patterns in what the user does and how they respond to situations. "
        "Be supportive and non-judgmental. Keep responses under 100 words. "
        "Help the user notice their behavioral patterns."
    ),
    "relational": (
        "You are an empathetic reflection companion for a journaling app. "
        "Your role is to provide brief insights about relationships and connections "
        "based on the user's recent journal entries. "
        "Focus on interpersonal patterns, social experiences, and relationships. "
        "Be understanding and relationship-focused. Keep responses under 100 words. "
        "Help the user understand their relational patterns."
    )
}


# User prompt templates
USER_PROMPT_WITH_JOURNALS = """Here are the user's recent journal entries:

{context}

Based on these entries, provide a brief {mode} reflection. Focus on patterns you notice and insights that might help them understand themselves better. Be warm, compassionate, and encouraging. Keep it personal and specific to their writing."""

USER_PROMPT_NO_JOURNALS = """The user hasn't written any journal entries yet. Provide a gentle, welcoming {mode} reflection that encourages them to start journaling and explains how this mirror will help them understand themselves better."""


def get_system_prompt(mode: str) -> str:
    """Get system prompt for a reflection mode."""
    return SYSTEM_PROMPTS.get(mode, SYSTEM_PROMPTS["emotional"])


def create_reflection_prompt(mode: str, has_journals: bool = True) -> ChatPromptTemplate:
    """
    Create a LangChain prompt template for mirror reflections.
    
    Args:
        mode: Reflection mode (emotional, cognitive, behavioral, relational)
        has_journals: Whether user has journal entries
        
    Returns:
        ChatPromptTemplate configured for the mode
    """
    system_prompt = get_system_prompt(mode)
    
    if has_journals:
        user_template = USER_PROMPT_WITH_JOURNALS
    else:
        user_template = USER_PROMPT_NO_JOURNALS
    
    return ChatPromptTemplate.from_messages([
        SystemMessagePromptTemplate.from_template(system_prompt),
        HumanMessagePromptTemplate.from_template(user_template)
    ])


def get_output_parser() -> StrOutputParser:
    """Get output parser for reflection responses."""
    return StrOutputParser()
