# Memory Module

This module handles context retrieval and user memory for AI operations.

## Purpose

The memory module provides a clean interface for retrieving and formatting user context (journals, emotions, etc.) for AI processing. As the app grows, this module will handle more sophisticated memory management.

## Structure

```
memory/
├── config.py        # Memory module configuration
└── service.py       # Memory retrieval and context building
```

## Current Features

### Context Retrieval
- Fetches recent journal entries for a user
- Builds formatted context strings for LLM consumption
- Configurable limits on context size

## Configuration

Settings in `config.py`:
- `default_context_limit`: Default number of journals to retrieve (default: 10)
- `max_context_limit`: Maximum allowed context size (default: 50)

## Usage

```python
from app.memory.service import MemoryService

memory = MemoryService()

# Get recent journals
journals = await memory.get_recent_journals(user_id="123", limit=10)

# Build formatted context for AI
context = await memory.build_journal_context(user_id="123", limit=10)
```

## Future Enhancements

- Add vector embeddings for semantic search
- Implement sliding window context
- Add mood/emotion tracking
- Support for conversation history
- Integration with LangChain memory components
- Implement summarization for long-term memory
