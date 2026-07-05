"""
Test configuration - API endpoint prefixes for E2E tests.
"""

from typing import Final


# API prefixes for use in tests
AUTH_PREFIX: Final[str] = "/api/v0/auth"
JOURNALS_PREFIX: Final[str] = "/api/v0/journals"
AI_PREFIX: Final[str] = "/api/v0/ai"
MIRROR_PREFIX: Final[str] = "/api/v0/mirror"
MEMORY_PREFIX: Final[str] = "/api/v0/memory"
CHAT_PREFIX: Final[str] = "/api/v0/chats"
