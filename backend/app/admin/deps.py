from app.admin.facade import AdminStatsFacade


def get_admin_stats_facade() -> AdminStatsFacade:
    """Dependency provider for AdminStatsFacade."""
    return AdminStatsFacade()
