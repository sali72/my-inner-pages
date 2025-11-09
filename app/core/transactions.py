"""
Transaction support for MongoDB operations using Beanie.
"""
from contextlib import asynccontextmanager
from typing import AsyncGenerator
from motor.motor_asyncio import AsyncIOMotorClientSession
from app.core.deps.database import get_db_manager
from app.core.exceptions import TransactionException
from app.core.logging import get_logger

logger = get_logger(__name__)


@asynccontextmanager
async def transaction() -> AsyncGenerator[AsyncIOMotorClientSession, None]:
    """
    Context manager for database transactions.
    
    Usage:
        async with transaction() as session:
            # Perform operations within transaction
            await journal.insert(session=session)
            await user.save(session=session)
            # Automatically commits on success, rolls back on exception
    
    Yields:
        MongoDB session for transaction operations
        
    Raises:
        TransactionException: If transaction fails
    """
    db_manager = get_db_manager()
    client = db_manager.get_client()
    
    async with await client.start_session() as session:
        async with session.start_transaction():
            try:
                logger.debug("transaction_started")
                yield session
                logger.debug("transaction_committed")
            except Exception as e:
                logger.error("transaction_failed", error=str(e), error_type=type(e).__name__)
                # Transaction will automatically abort on exception
                raise TransactionException(
                    f"Transaction failed: {str(e)}",
                    details={"error_type": type(e).__name__, "error": str(e)}
                )


@asynccontextmanager
async def optional_transaction(
    use_transaction: bool = True
) -> AsyncGenerator[AsyncIOMotorClientSession | None, None]:
    """
    Context manager for optional transactions.
    Useful when you want to conditionally use transactions.
    
    Usage:
        async with optional_transaction(use_transaction=True) as session:
            await journal.insert(session=session)
    
    Args:
        use_transaction: Whether to use a transaction
        
    Yields:
        MongoDB session if transaction enabled, None otherwise
    """
    if use_transaction:
        async with transaction() as session:
            yield session
    else:
        yield None
