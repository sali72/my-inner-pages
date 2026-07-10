"""Rate limiting for API endpoints."""
import time
from collections import defaultdict
from typing import Dict, Tuple
from fastapi import Request, HTTPException, status
from app.core.logging import get_logger

logger = get_logger(__name__)


class RateLimiter:
    """Simple in-memory rate limiter."""
    
    def __init__(self):
        # Store: {client_ip: [(timestamp, count)]}
        self.requests: Dict[str, list[Tuple[float, int]]] = defaultdict(list)
        self.cleanup_interval = 60  # Clean up old entries every 60 seconds
        self.last_cleanup = time.time()
    
    def _cleanup_old_entries(self):
        """Remove entries older than the window."""
        current_time = time.time()
        if current_time - self.last_cleanup > self.cleanup_interval:
            for ip in list(self.requests.keys()):
                self.requests[ip] = [
                    (ts, count) for ts, count in self.requests[ip]
                    if current_time - ts < 3600  # Keep last hour
                ]
                if not self.requests[ip]:
                    del self.requests[ip]
            self.last_cleanup = current_time
    
    def check_rate_limit(
        self,
        client_ip: str,
        max_requests: int,
        window_seconds: int
    ) -> bool:
        """
        Check if request is within rate limit.
        
        Args:
            client_ip: Client IP address
            max_requests: Maximum requests allowed
            window_seconds: Time window in seconds
            
        Returns:
            True if within limit, False if exceeded
        """
        self._cleanup_old_entries()
        
        current_time = time.time()
        window_start = current_time - window_seconds
        
        # Get requests within window
        recent_requests = [
            (ts, count) for ts, count in self.requests[client_ip]
            if ts > window_start
        ]
        
        # Count total requests
        total_requests = sum(count for _, count in recent_requests)
        
        if total_requests >= max_requests:
            logger.warning(
                "rate_limit_exceeded",
                client_ip=client_ip,
                requests=total_requests,
                limit=max_requests,
                window=window_seconds
            )
            return False
        
        # Add current request
        self.requests[client_ip] = recent_requests + [(current_time, 1)]
        return True


# Global rate limiter instance
rate_limiter = RateLimiter()


def check_rate_limit(
    request: Request,
):
    from app.core.deps.settings import get_settings

    settings = get_settings()
    max_requests = settings.rate_limit_max_requests
    window_seconds = settings.rate_limit_window_seconds

    if not settings.is_production:
        max_requests = 100

    client_ip = request.client.host if request.client else "unknown"

    if not rate_limiter.check_rate_limit(client_ip, max_requests, window_seconds):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Maximum {max_requests} requests per {window_seconds} seconds."
        )
