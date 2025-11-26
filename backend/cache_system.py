"""
Response Caching System for JoBika
Implements Redis-like caching with fallback to in-memory cache
"""

import json
import time
from functools import wraps
from datetime import datetime, timedelta

class SimpleCache:
    """In-memory cache implementation"""
    
    def __init__(self):
        self.cache = {}
        self.expiry = {}
    
    def get(self, key):
        """Get value from cache"""
        if key in self.cache:
            # Check if expired
            if key in self.expiry and time.time() > self.expiry[key]:
                del self.cache[key]
                del self.expiry[key]
                return None
            return self.cache[key]
        return None
    
    def set(self, key, value, ttl=300):
        """Set value in cache with TTL (time to live) in seconds"""
        self.cache[key] = value
        if ttl > 0:
            self.expiry[key] = time.time() + ttl
    
    def delete(self, key):
        """Delete key from cache"""
        if key in self.cache:
            del self.cache[key]
        if key in self.expiry:
            del self.expiry[key]
    
    def clear(self):
        """Clear all cache"""
        self.cache.clear()
        self.expiry.clear()
    
    def get_stats(self):
        """Get cache statistics"""
        active = 0
        expired = 0
        current_time = time.time()
        
        for key in self.cache:
            if key in self.expiry:
                if current_time > self.expiry[key]:
                    expired += 1
                else:
                    active += 1
            else:
                active += 1
        
        return {
            'total_keys': len(self.cache),
            'active_keys': active,
            'expired_keys': expired,
            'cache_size_kb': len(json.dumps(self.cache)) / 1024
        }

# Global cache instance
cache = SimpleCache()

def cache_response(ttl=300, key_prefix=''):
    """
    Decorator to cache API responses
    
    Args:
        ttl: Time to live in seconds (default 5 minutes)
        key_prefix: Prefix for cache key
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            from flask import request, jsonify
            
            # Generate cache key from endpoint and query params
            cache_key = f"{key_prefix}:{f.__name__}:{request.path}"
            
            # Add query params to key
            if request.args:
                query_string = '&'.join(f"{k}={v}" for k, v in sorted(request.args.items()))
                cache_key += f"?{query_string}"
            
            # Add user ID to key for authenticated endpoints
            auth_header = request.headers.get('Authorization', '')
            if auth_header:
                # Extract user ID from token (simplified)
                cache_key += f":user:{auth_header[-10:]}"  # Last 10 chars of token
            
            # Check cache
            cached_response = cache.get(cache_key)
            if cached_response is not None:
                print(f"✅ Cache HIT: {cache_key}")
                # Add cache header
                response = jsonify(cached_response)
                response.headers['X-Cache'] = 'HIT'
                return response
            
            print(f"❌ Cache MISS: {cache_key}")
            
            # Call actual function
            result = f(*args, **kwargs)
            
            # Cache successful responses only
            if isinstance(result, tuple):
                response_data, status_code = result
                if status_code == 200:
                    cache.set(cache_key, response_data, ttl)
            else:
                # Assume it's just data with 200 status
                cache.set(cache_key, result, ttl)
            
            # Add cache header
            if isinstance(result, tuple):
                from flask import jsonify
                response = jsonify(result[0])
                response.headers['X-Cache'] = 'MISS'
                response.status_code = result[1] if len(result) > 1 else 200
                return response
            
            return result
        
        return decorated_function
    return decorator

def invalidate_cache(pattern='*'):
    """Invalidate cache entries matching pattern"""
    if pattern == '*':
        cache.clear()
        print("🗑️  All cache cleared")
        return
    
    # Pattern matching (simple implementation)
    keys_to_delete = [k for k in cache.cache.keys() if pattern in k]
    for key in keys_to_delete:
        cache.delete(key)
    
    print(f"🗑️  Cleared {len(keys_to_delete)} cache entries matching '{pattern}'")

def warm_cache(jobs_data):
    """Warm up cache with frequently accessed data"""
    # Cache job listings
    cache.set('cache:jobs:all', jobs_data, ttl=600)  # 10 minutes
    print(f"🔥 Cache warmed with {len(jobs_data)} jobs")

def init_cache_endpoints(app):
    """Initialize cache management endpoints"""
    from flask import jsonify
    
    @app.route('/api/cache/stats')
    def cache_stats():
        """Get cache statistics"""
        stats = cache.get_stats()
        return jsonify(stats)
    
    @app.route('/api/cache/clear', methods=['POST'])
    def clear_cache():
        """Clear all cache (admin only)"""
        # In production, add authentication check
        cache.clear()
        return jsonify({'message': 'Cache cleared successfully'})
    
    @app.after_request
    def add_cache_headers(response):
        """Add cache-related headers to responses"""
        # Don't cache by default
        if 'X-Cache' not in response.headers:
            response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
            response.headers['Pragma'] = 'no-cache'
            response.headers['Expires'] = '0'
        
        return response
    
    print("✅ Cache system initialized")

# Example usage patterns:
# @cache_response(ttl=600)  # Cache for 10 minutes
# def get_jobs():
#     ...
#
# @cache_response(ttl=300, key_prefix='user')  # Cache per user for 5 minutes
# def get_user_data():
#     ...
