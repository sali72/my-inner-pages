"""
API Configuration - Single Source of Truth for API Routes

This module provides centralized configuration for all API endpoints.
All routes should be imported from this module to ensure consistency
across the application and tests.
"""

from typing import Final


class APIVersion:
    """API version configuration."""
    V0: Final[str] = "/api/v0"


class AuthRoutes:
    """Authentication module routes."""
    BASE: Final[str] = f"{APIVersion.V0}/auth"
    REGISTER: Final[str] = f"{BASE}/register"
    LOGIN: Final[str] = f"{BASE}/login"
    ME: Final[str] = f"{BASE}/me"
    VERIFY: Final[str] = f"{BASE}/verify"
    RESET_PASSWORD: Final[str] = f"{BASE}/reset-password"


class JournalRoutes:
    """Journal module routes."""
    BASE: Final[str] = f"{APIVersion.V0}/journals"
    CREATE: Final[str] = BASE  # POST to base URL
    LIST: Final[str] = BASE    # GET to base URL
    
    @staticmethod
    def get(journal_id: str) -> str:
        """Get route for specific journal by ID."""
        return f"{JournalRoutes.BASE}/{journal_id}"
    
    @staticmethod
    def update(journal_id: str) -> str:
        """Update route for specific journal by ID."""
        return f"{JournalRoutes.BASE}/{journal_id}"
    
    @staticmethod
    def delete(journal_id: str) -> str:
        """Delete route for specific journal by ID."""
        return f"{JournalRoutes.BASE}/{journal_id}"


class MirrorRoutes:
    """AI Mirror module routes."""
    BASE: Final[str] = f"{APIVersion.V0}/mirror"
    REFLECTION: Final[str] = f"{BASE}/reflection"


class HealthRoutes:
    """Health check routes."""
    ROOT: Final[str] = "/"
    HEALTH: Final[str] = "/health"


class APIRoutes:
    """Centralized API routes configuration."""
    Auth = AuthRoutes
    Journal = JournalRoutes
    Mirror = MirrorRoutes
    Health = HealthRoutes


# Convenience exports for easier imports
__all__ = [
    "APIRoutes",
    "APIVersion",
    "AuthRoutes",
    "JournalRoutes",
    "MirrorRoutes",
    "HealthRoutes",
]
