import functools
import time
from typing import Optional

# Simple in-memory cache for read endpoints
# Key: (endpoint_name, tenant_id, cache_key)
_cache = {}
_cache_ttl = {}

def cache_response(ttl_seconds: int = 60):
    """Decorator to cache function results for a given TTL."""
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # Build cache key from function name and args
            cache_key = f"{func.__name__}:{str(args)}:{str(sorted(kwargs.items()))}"
            now = time.time()
            
            # Check cache
            if cache_key in _cache:
                if _cache_ttl.get(cache_key, 0) > now:
                    return _cache[cache_key]
                # Expired, clean up
                _cache.pop(cache_key, None)
                _cache_ttl.pop(cache_key, None)
            
            # Call function and cache result
            result = func(*args, **kwargs)
            _cache[cache_key] = result
            _cache_ttl[cache_key] = now + ttl_seconds
            return result
        return wrapper
    return decorator

def invalidate_cache(pattern: Optional[str] = None):
    """Invalidate cache entries matching a pattern."""
    global _cache, _cache_ttl
    if pattern is None:
        _cache.clear()
        _cache_ttl.clear()
    else:
        keys_to_remove = [k for k in _cache if pattern in k]
        for k in keys_to_remove:
            _cache.pop(k, None)
            _cache_ttl.pop(k, None)
