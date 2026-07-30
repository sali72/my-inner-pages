"""
Authentication routes configuration.
"""

from typing import Final


class AuthRoutes:
    """Authentication route paths (relative to router prefix)."""
    REGISTER: Final[str] = "/register"
    LOGIN: Final[str] = "/login"
    LOGOUT: Final[str] = "/logout"
    ME: Final[str] = "/me"
    VERIFY: Final[str] = "/verify"
    VERIFY_EMAIL: Final[str] = "/verify-email/{token}"
    RESEND_VERIFICATION: Final[str] = "/resend-verification"
    RESET_PASSWORD: Final[str] = "/reset-password"
    PREFERENCES: Final[str] = "/me/preferences"
    GOOGLE_LOGIN: Final[str] = "/google/login"
    GOOGLE_CALLBACK: Final[str] = "/google/callback"
