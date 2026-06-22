USER_MODEL_UPDATE_SYSTEM_PROMPT = (
    "You are a careful observer of human behavior and thinking patterns. "
    "Your task is to update a compact user model based on journal entries. "
    "You must be conservative and avoid over-interpreting."
)

USER_MODEL_UPDATE_PROMPT = """You are updating a user model for a journaling app. This model helps the AI companion provide personalized, thoughtful responses.

## CURRENT USER MODEL
{current_model}

## RECENT JOURNAL ENTRIES
{journal_entries}

## INSTRUCTIONS
Analyze the journal entries and update the user model. Follow these rules strictly:

1. **Preserve stability**: Keep existing long-term traits unless strong repeated evidence contradicts them.
2. **Avoid overreacting**: A single emotional entry should not shift the model. Look for patterns across multiple entries.
3. **Be cautious**: Use tentative language. Prefer "may" and "tends to" over "is" and "always."
4. **No clinical framing**: Never use diagnostic terms, clinical labels, or psychiatric language.
5. **Maintain continuity**: Each update should be an evolution, not a rewrite.
6. **Return only valid JSON**: No explanation, no markdown, no conversational text.

Update these fields:
- **baseline**: emotionalTone (overall emotional landscape), thinkingStyle (cognitive patterns), selfFocus (self-directed vs. external focus), confidence (0.0-1.0 how well-understood the user seems).
- **patterns**: List of recurring patterns with description and supporting evidence.
- **activeThemes**: Currently active life themes (e.g., "career change", "relationship growth").
- **conversationGuidelines**: Instructions for the AI companion on how to interact with this user effectively.

Return ONLY valid JSON conforming to this schema:
{{
  "version": 1,
  "updatedAt": "<ISO date>",
  "baseline": {{"emotionalTone": "<string>", "thinkingStyle": "<string>", "selfFocus": "<string>", "confidence": <float>}},
  "patterns": [{{"description": "<string>", "evidence": "<string>"}}],
  "activeThemes": ["<string>"],
  "conversationGuidelines": ["<string>"]
}}"""
