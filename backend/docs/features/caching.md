# Caching

## Overview

Simple in-memory caching for frequently accessed data to reduce database load and improve response times.

## Implementation

- **Type**: In-memory cache with TTL
- **Default TTL**: 5 minutes (300 seconds)
- **Cached Data**: User information from JWT tokens

## Usage

```python
from app.core.cache import user_cache

# Set value
user_cache.set("user:123", user_object, ttl=300)

# Get value
user = user_cache.get("user:123")  # Returns None if not found/expired

# Delete value
user_cache.delete("user:123")

# Get statistics
stats = user_cache.get_stats()
# Returns: {"hits": 100, "misses": 20, "hit_rate": 83.33, "size": 50}
```

## Benefits

- **Reduced Database Load**: User lookups cached for 5 minutes
- **Faster Response Times**: ~1-2ms cache hit vs ~10-20ms database query
- **Automatic Expiration**: Old entries automatically removed

## Cache Statistics

Access cache statistics:

```python
stats = user_cache.get_stats()
print(f"Hit rate: {stats['hit_rate']}%")
print(f"Cache size: {stats['size']} entries")
```

## Future Improvements

For production at scale, consider:
- Redis for distributed caching
- Cache warming strategies
- Cache invalidation on user updates
- Multiple cache instances for different data types
