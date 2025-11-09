"""
Test configuration - API endpoint prefixes for E2E tests.
"""

from typing import Final


# API prefixes for use in tests
AUTH_PREFIX: Final[str] = "/api/v0/auth"
JOURNALS_PREFIX: Final[str] = "/api/v0/journals"
MIRROR_PREFIX: Final[str] = "/api/v0/mirror"
