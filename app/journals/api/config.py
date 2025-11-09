"""
Journal routes configuration.
"""

from typing import Final


class JournalRoutes:
    """Journal route paths (relative to router prefix)."""
    ROOT: Final[str] = ""  # Base route (list/create)
    BY_ID: Final[str] = "/{journal_id}"  # Get/Update/Delete by ID
