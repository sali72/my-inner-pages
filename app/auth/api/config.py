"""
Authentication routes configuration.
"""

from typing import Final


class AuthRoutes:
    """Authentication route paths (relative to router prefix)."""
    REGISTER: Final[str] = "/register"
    LOGIN: Final[str] = "/login"
    ME: Final[str] = "/me"
    VERIFY: Final[str] = "/verify"
    RESET_PASSWORD: Final[str] = "/reset-password"
    PREFERENCES: Final[str] = "/me/preferences"
