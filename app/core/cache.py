"""Simple in-memory caching."""
import time
from typing import Any, Optional, Dict, Tuple
from app.core.logging import get_logger

logger = get_logger(__name__)


class SimpleCache:
    """Simple in-memory cache with TTL."""
    
    def __init__(self, default_ttl: int = 300):
        """
        Initialize cache.
        
        Args:
            default_ttl: Default time-to-live in seconds (default: 5 minutes)
        """
        self.cache: Dict[str, Tuple[Any, float]] = {}
        self.default_ttl = default_ttl
        self.hits = 0
        self.misses = 0
    
    def get(self, key: str) -> Optional[Any]:
        """
        Get value from cache.
        
        Args:
            key: Cache key
            
        Returns:
            Cached value or None if not found/expired
        """
        if key in self.cache:
            value, expires_at = self.cache[key]
            if time.time() < expires_at:
                self.hits += 1
                logger.debug("cache_hit", key=key)
                return value
            else:
                # Expired
                del self.cache[key]
                logger.debug("cache_expired", key=key)
        
        self.misses += 1
        logger.debug("cache_miss", key=key)
        return None
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None):
        """
        Set value in cache.
        
        Args:
            key: Cache key
            value: Value to cache
            ttl: Time-to-live in seconds (uses default if not provided)
        """
        ttl = ttl if ttl is not None else self.default_ttl
        expires_at = time.time() + ttl
        self.cache[key] = (value, expires_at)
        logger.debug("cache_set", key=key, ttl=ttl)
    
    def delete(self, key: str):
        """
        Delete value from cache.
        
        Args:
            key: Cache key
        """
        if key in self.cache:
            del self.cache[key]
            logger.debug("cache_delete", key=key)
    
    def clear(self):
        """Clear all cache entries."""
        self.cache.clear()
        logger.info("cache_cleared")
    
    def get_stats(self) -> dict:
        """Get cache statistics."""
        total = self.hits + self.misses
        hit_rate = (self.hits / total * 100) if total > 0 else 0
        
        return {
            "hits": self.hits,
            "misses": self.misses,
            "hit_rate": round(hit_rate, 2),
            "size": len(self.cache)
        }


# Global cache instance
user_cache = SimpleCache(default_ttl=300)  # 5 minutes for user data
