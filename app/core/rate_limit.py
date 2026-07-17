"""Rate limiting for API endpoints using slowapi + limits."""

from slowapi import Limiter
from slowapi.util import get_remote_address
from limits import RateLimitItemPerMinute

from app.core.logging import get_logger

logger = get_logger(__name__)


limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["60/minute"],
)


def configure_limiter(settings):
    """Swap to Redis-backed storage in production.

    In development/testing the default in-memory storage is used.
    In production with a Redis URL configured, we swap to Redis so that
    blue/green backend containers share the same rate limit state.
    """
    if settings.is_production and settings.redis_url:
        from limits.storage import RedisStorage
        from limits.strategies import MovingWindowRateLimiter

        storage = RedisStorage(settings.redis_url)
        limiter.limiter = MovingWindowRateLimiter(storage)
        logger.info("rate_limiter_redis", url=settings.redis_url)
    else:
        logger.info("rate_limiter_memory")


def check_ws_rate_limit(key: str, max_requests: int = 5) -> bool:
    """Programmatic rate check using the shared backend.

    Used for WebSocket connections (not supported by slowapi).
    Returns True if request is allowed, False if rate limited.
    """
    allowed = limiter.limiter.hit(RateLimitItemPerMinute(max_requests), key)
    if not allowed:
        logger.warning("ws_rate_limit_exceeded", key=key, limit=max_requests)
    return allowed
