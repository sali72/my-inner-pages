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
    # Router prefix
    PREFIX: Final[str] = "/auth"
    
    # Route paths (relative to prefix, for use in route decorators)
    REGISTER: Final[str] = "/register"
    LOGIN: Final[str] = "/login"
    ME: Final[str] = "/me"
    VERIFY: Final[str] = "/verify"
    RESET_PASSWORD: Final[str] = "/reset-password"
    
    # Full paths (for tests/clients)
    @staticmethod
    def full(path: str) -> str:
        """Get full path including API version and prefix."""
        return f"{APIVersion.V0}{AuthRoutes.PREFIX}{path}"


class JournalRoutes:
    """Journal module routes."""
    # Router prefix
    PREFIX: Final[str] = "/journals"
    
    # Route paths (relative to prefix, for use in route decorators)
    ROOT: Final[str] = ""  # Base route (list/create)
    BY_ID: Final[str] = "/{journal_id}"  # Get/Update/Delete by ID
    
    # Full paths (for tests/clients)
    @staticmethod
    def full(path: str = "") -> str:
        """Get full path including API version and prefix."""
        return f"{APIVersion.V0}{JournalRoutes.PREFIX}{path}"


class MirrorRoutes:
    """AI Mirror module routes."""
    # Router prefix
    PREFIX: Final[str] = "/mirror"
    
    # Route paths (relative to prefix, for use in route decorators)
    REFLECTION: Final[str] = "/reflection"
    
    # Full paths (for tests/clients)
    @staticmethod
    def full(path: str) -> str:
        """Get full path including API version and prefix."""
        return f"{APIVersion.V0}{MirrorRoutes.PREFIX}{path}"


class HealthRoutes:
    """Health check routes."""
    ROOT: Final[str] = "/"
    HEALTH: Final[str] = "/health"


class APIRoutes:
    """
    Centralized API routes configuration.
    
    Usage in route decorators:
        @router.post(AuthRoutes.REGISTER)
        
    Usage in tests/clients:
        response = await client.post(AuthRoutes.full(AuthRoutes.REGISTER))
    """
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
