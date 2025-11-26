"""
Performance Monitoring for JoBika
Tracks API performance and generates reports
"""

import time
from functools import wraps
from datetime import datetime
import json
import os

class PerformanceMonitor:
    """Monitor API endpoint performance"""
    
    def __init__(self):
        self.metrics = []
        self.log_file = 'performance_log.json'
        self.load_metrics()
    
    def load_metrics(self):
        """Load existing metrics from file"""
        if os.path.exists(self.log_file):
            try:
                with open(self.log_file, 'r') as f:
                    self.metrics = json.load(f)
            except:
                self.metrics = []
    
    def save_metrics(self):
        """Save metrics to file"""
        try:
            with open(self.log_file, 'w') as f:
                json.dump(self.metrics[-1000:], f, indent=2)  # Keep last 1000
        except Exception as e:
            print(f"⚠️  Could not save metrics: {e}")
    
    def record_request(self, endpoint, method, duration, status_code, user_id=None):
        """Record a request metric"""
        metric = {
            'endpoint': endpoint,
            'method': method,
            'duration_ms': round(duration * 1000, 2),
            'status_code': status_code,
            'timestamp': datetime.now().isoformat(),
            'user_id': user_id
        }
        self.metrics.append(metric)
        
        # Save periodically
        if len(self.metrics) % 10 == 0:
            self.save_metrics()
    
    def get_stats(self, endpoint=None, hours=24):
        """Get performance statistics"""
        from datetime import timedelta
        
        cutoff = datetime.now() - timedelta(hours=hours)
        recent_metrics = [
            m for m in self.metrics
            if datetime.fromisoformat(m['timestamp']) > cutoff
        ]
        
        if endpoint:
            recent_metrics = [m for m in recent_metrics if m['endpoint'] == endpoint]
        
        if not recent_metrics:
            return None
        
        durations = [m['duration_ms'] for m in recent_metrics]
        status_codes = [m['status_code'] for m in recent_metrics]
        
        return {
            'total_requests': len(recent_metrics),
            'avg_duration_ms': round(sum(durations) / len(durations), 2),
            'min_duration_ms': min(durations),
            'max_duration_ms': max(durations),
            'success_rate': len([s for s in status_codes if 200 <= s < 300]) / len(status_codes) * 100,
            'error_rate': len([s for s in status_codes if s >= 400]) / len(status_codes) * 100
        }
    
    def get_slow_endpoints(self, threshold_ms=1000, hours=24):
        """Get endpoints that are slower than threshold"""
        from datetime import timedelta
        
        cutoff = datetime.now() - timedelta(hours=hours)
        recent_metrics = [
            m for m in self.metrics
            if datetime.fromisoformat(m['timestamp']) > cutoff
        ]
        
        slow_requests = [m for m in recent_metrics if m['duration_ms'] > threshold_ms]
        
        # Group by endpoint
        endpoint_times = {}
        for req in slow_requests:
            endpoint = req['endpoint']
            if endpoint not in endpoint_times:
                endpoint_times[endpoint] = []
            endpoint_times[endpoint].append(req['duration_ms'])
        
        # Calculate averages
        slow_endpoints = []
        for endpoint, times in endpoint_times.items():
            slow_endpoints.append({
                'endpoint': endpoint,
                'count': len(times),
                'avg_duration_ms': round(sum(times) / len(times), 2),
                'max_duration_ms': max(times)
            })
        
        return sorted(slow_endpoints, key=lambda x: x['avg_duration_ms'], reverse=True)

# Global monitor instance
monitor = PerformanceMonitor()

def track_performance(f):
    """Decorator to track endpoint performance"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        start_time = time.time()
        
        # Execute function
        response = f(*args, **kwargs)
        
        # Calculate duration
        duration = time.time() - start_time
        
        # Get response details
        status_code = 200
        if isinstance(response, tuple):
            status_code = response[1] if len(response) > 1 else 200
        
        # Record metric
        from flask import request
        endpoint = request.endpoint or request.path
        method = request.method
        user_id = kwargs.get('user_id')
        
        monitor.record_request(endpoint, method, duration, status_code, user_id)
        
        # Log slow requests
        if duration > 1.0:  # 1 second
            print(f"⚠️  Slow request: {method} {endpoint} took {duration*1000:.2f}ms")
        
        return response
    
    return decorated_function

def init_performance_monitoring(app):
    """Initialize performance monitoring"""
    
    @app.before_request
    def before_request():
        """Store request start time"""
        from flask import g
        g.start_time = time.time()
    
    @app.after_request
    def after_request(response):
        """Log request duration"""
        from flask import g, request
        
        if hasattr(g, 'start_time'):
            duration = time.time() - g.start_time
            endpoint = request.endpoint or request.path
            method = request.method
            status_code = response.status_code
            
            monitor.record_request(endpoint, method, duration, status_code)
            
            # Add performance header
            response.headers['X-Response-Time'] = f"{duration*1000:.2f}ms"
        
        return response
    
    # Add performance stats endpoint
    @app.route('/api/performance/stats')
    def performance_stats():
        """Get performance statistics"""
        from flask import request, jsonify
        
        endpoint = request.args.get('endpoint')
        hours = int(request.args.get('hours', 24))
        
        stats = monitor.get_stats(endpoint, hours)
        slow_endpoints = monitor.get_slow_endpoints(threshold_ms=1000, hours=hours)
        
        return jsonify({
            'stats': stats,
            'slow_endpoints': slow_endpoints
        })
    
    print("✅ Performance monitoring initialized")
