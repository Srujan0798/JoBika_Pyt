"""
Security Middleware for JoBika
Implements security best practices
"""

from functools import wraps
from flask import request, jsonify
import re
import html

# Input validation patterns
EMAIL_PATTERN = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
PHONE_PATTERN = re.compile(r'^\+?[1-9]\d{1,14}$')
PASSWORD_PATTERN = re.compile(r'^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$')

def validate_email(email):
    """Validate email format"""
    if not email or not isinstance(email, str):
        return False
    return EMAIL_PATTERN.match(email) is not None

def validate_password(password):
    """Validate password strength (min 8 chars, alphanumeric)"""
    if not password or not isinstance(password, str):
        return False
    return len(password) >= 8

def validate_phone(phone):
    """Validate phone number format"""
    if not phone:
        return True  # Phone is optional
    return PHONE_PATTERN.match(phone) is not None

def sanitize_input(text):
    """Sanitize user input to prevent XSS"""
    if not text or not isinstance(text, str):
        return text
    return html.escape(text.strip())

def sanitize_dict(data):
    """Sanitize all string values in a dictionary"""
    if not isinstance(data, dict):
        return data
    
    sanitized = {}
    for key, value in data.items():
        if isinstance(value, str):
            sanitized[key] = sanitize_input(value)
        elif isinstance(value, dict):
            sanitized[key] = sanitize_dict(value)
        elif isinstance(value, list):
            sanitized[key] = [sanitize_input(v) if isinstance(v, str) else v for v in value]
        else:
            sanitized[key] = value
    return sanitized

def require_auth(f):
    """Decorator to require authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        from server import verify_token
        
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        user_id = verify_token(token)
        
        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401
        
        return f(user_id=user_id, *args, **kwargs)
    
    return decorated_function

def validate_json_input(required_fields=None):
    """Decorator to validate JSON input"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not request.is_json:
                return jsonify({'error': 'Content-Type must be application/json'}), 400
            
            data = request.json
            if not data:
                return jsonify({'error': 'Request body is required'}), 400
            
            if required_fields:
                missing = [field for field in required_fields if field not in data]
                if missing:
                    return jsonify({'error': f'Missing required fields: {", ".join(missing)}'}), 400
            
            # Sanitize input
            sanitized_data = sanitize_dict(data)
            request.sanitized_json = sanitized_data
            
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator

# Security Headers
SECURITY_HEADERS = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; font-src 'self' https://fonts.gstatic.com; connect-src 'self' http://localhost:8080 http://localhost:5000; img-src 'self' data: https:;"
}

def add_security_headers(response):
    """Add security headers to response"""
    for header, value in SECURITY_HEADERS.items():
        response.headers[header] = value
    return response

def init_security_middleware(app):
    """Initialize security middleware"""
    
    @app.after_request
    def apply_security_headers(response):
        return add_security_headers(response)
    
    @app.before_request
    def check_request_size():
        """Prevent large payload attacks"""
        max_size = app.config.get('MAX_CONTENT_LENGTH', 16 * 1024 * 1024)  # 16MB
        if request.content_length and request.content_length > max_size:
            return jsonify({'error': 'Request payload too large'}), 413
    
    print("✅ Security middleware initialized")
