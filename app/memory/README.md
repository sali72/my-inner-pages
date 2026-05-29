# Memory Module

This module handles context retrieval, user memory, and persistent user models for AI journaling conversations.

## Purpose

Provides a minimal, stable system that gives the AI continuity across conversations and journal entries. Consists of three components: **User Model**, **User Model Updater**, and **Context Injector**.

## Structure

```
memory/
├── config.py           # Memory module configuration
├── deps.py             # FastAPI dependency wiring
├── service.py          # Memory retrieval and context injection
├── db/
│   ├── models.py       # UserModel Beanie document
│   └── repository.py   # UserModelRepository CRUD
├── prompts/
│   ├── update_prompt.py        # LLM prompt for user model updates
│   └── context_injection.py    # JSON context injection formatting
└── services/
    └── user_model_updater.py   # Periodic user model update service
```

## Components

### 1. User Model

A compact JSON summary per user stored in MongoDB (`user_models` collection):

- **baseline**: Emotional tone, thinking style, self-focus, confidence
- **patterns**: Recurring patterns with evidence
- **activeThemes**: Current life themes
- **conversationGuidelines**: Instructions for AI companion

### 2. User Model Updater

Triggers every X entries or Y words. Sends recent journals + current model to LLM, which returns a conservatively updated model.

### 3. Context Injector

Builds structured JSON context for LLM prompts:

```
--- user_model ---
{...}

--- recent_entries ---
[{...}]

--- chat_history ---
[{...}]
```

## Configuration

Settings in `config.py`:

- `default_context_limit`: Default number of journals (default: 10)
- `max_context_limit`: Maximum context size (default: 50)
- `max_journals_for_context`: Journals in injected context (default: 5)
- `max_journals_for_updater`: Journals sent for model updates (default: 50)
- `update_after_entries`: Trigger update every N entries (default: 5)
- `update_after_words`: Trigger update every N words (default: 2000)
- `updater_max_tokens`: Max tokens for LLM update call (default: 1000)
- `updater_temperature`: LLM temperature for updates (default: 0.3)
