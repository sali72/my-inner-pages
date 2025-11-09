# This file is kept for backward compatibility
# The actual get_current_user dependency is now in app.auth.deps
# to avoid circular import issues

from app.auth.deps import get_current_user, get_current_active_user

__all__ = ["get_current_user", "get_current_active_user"]
