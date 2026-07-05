"""Database dependency injection with session per request pattern."""

from typing import AsyncGenerator
from functools import cache
import contextvars
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorClientSession
from beanie import init_beanie

from app.core.config import Settings
from app.core.deps.settings import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)

# Context variable to store the current session
current_session: contextvars.ContextVar[AsyncIOMotorClientSession | None] = (
    contextvars.ContextVar("db_session", default=None)
)


@cache
def create_motor_client(settings: Settings) -> AsyncIOMotorClient:
    """
    Create and cache a MongoDB client - one per process.

    Args:
        settings: Application settings

    Returns:
        Cached MongoDB client
    """
    logger.info("creating_mongodb_client", url=settings.mongo_url)
    return AsyncIOMotorClient(settings.mongo_url)


async def get_client() -> AsyncIOMotorClient:
    """
    Get the MongoDB client and ensure Beanie is initialized.

    Returns:
        MongoDB client with Beanie initialized
    """
    settings = get_settings()
    client = create_motor_client(settings)

    # Only initialize Beanie once per client
    if not hasattr(client, "_beanie_initialized"):
        from app.journals.db.models import Journal
        from app.auth.db.models import User
        from app.memory.db.models import UserModel
        from app.chat.db.models import Chat

        logger.info("initializing_beanie", database=settings.database_name)
        await init_beanie(
            database=client[settings.database_name],
            document_models=[Journal, User, UserModel, Chat]
        )
        client._beanie_initialized = True
        logger.info("beanie_initialized")

    return client


async def get_db() -> AsyncGenerator[AsyncIOMotorClientSession, None]:
    """
    Dependency that yields a new MongoDB session for each request.

    This ensures each API call operates in its own session and
    sets the session in a context variable for global access.

    Usage:
        @router.post("/endpoint", dependencies=[Depends(get_db)])
        async def endpoint():
            session = get_current_session()
            await repository.create(..., session=session)

    Yields:
        MongoDB session for the current request
    """
    client = await get_client()
    async with await client.start_session() as session:
        # Store the session in the context variable
        set_current_session(session)
        logger.debug("db_session_started")
        try:
            yield session
        finally:
            set_current_session(None)
            logger.debug("db_session_closed")


def get_current_session() -> AsyncIOMotorClientSession | None:
    """
    Get the current session from the context variable.

    Returns:
        Current MongoDB session or None if not in a request context
    """
    return current_session.get()


def set_current_session(session: AsyncIOMotorClientSession | None) -> None:
    """
    Set the current session in the context variable.

    Args:
        session: MongoDB session to set
    """
    current_session.set(session)
