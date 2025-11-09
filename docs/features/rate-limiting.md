# Rate Limiting

## Overview

Rate limiting protects authentication endpoints from brute force attacks by limiting the number of requests from a single IP address.

## Implementation

- **Type**: In-memory rate limiter
- **Scope**: Per IP address
- **Default Limit**: 5 requests per 60 seconds
- **Applied To**: `/api/v0/auth/login` endpoint

## Usage

```python
from app.core.rate_limit import check_rate_limit

@router.post("/login", dependencies=[Depends(check_rate_limit)])
async def login(...):
    # Rate limited automatically
    pass
```

## Configuration

Customize limits per endpoint:

```python
from functools import partial

# Custom rate limit: 10 requests per 120 seconds
custom_limit = partial(check_rate_limit, max_requests=10, window_seconds=120)

@router.post("/endpoint", dependencies=[Depends(custom_limit)])
async def endpoint(...):
    pass
```

## Response

When rate limit is exceeded:
- **Status Code**: 429 Too Many Requests
- **Response**: `{"detail": "Rate limit exceeded. Maximum 5 requests per 60 seconds."}`

## Future Improvements

For production at scale, consider:
- Redis-based rate limiting (distributed)
- Per-user rate limiting (not just IP)
- Different limits for different endpoints
- Rate limit headers (X-RateLimit-Remaining, etc.)
