from functools import lru_cache
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import Settings
from app.core.db import DatabaseManager


_db_manager: DatabaseManager | None = None


def set_db_manager(manager: DatabaseManager) -> None:
    """Set the global database manager instance."""
    global _db_manager
    _db_manager = manager


def get_db_manager() -> DatabaseManager:
    """Get the global database manager instance."""
    if _db_manager is None:
        raise RuntimeError("Database manager not initialized")
    return _db_manager


@lru_cache
def get_settings() -> Settings:
    """Get cached application settings."""
    return Settings()


def get_db_client() -> AsyncIOMotorClient:
    """Dependency to get MongoDB client."""
    return get_db_manager().get_client()


def get_database() -> AsyncIOMotorDatabase:
    """Dependency to get MongoDB database."""
    settings = get_settings()
    client = get_db_client()
    return client[settings.database_name]
