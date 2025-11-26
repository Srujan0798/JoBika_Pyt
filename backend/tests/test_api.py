"""
JoBika API Integration Tests
Tests API endpoints
"""

import unittest
import json
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from server import app

class TestAPIEndpoints(unittest.TestCase):
    """Test API endpoints"""
    
    def setUp(self):
        """Set up test client"""
        self.app = app.test_client()
        self.app.testing = True
    
    def test_health_endpoint(self):
        """Test health check endpoint"""
        response = self.app.get('/api/health')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'healthy')
    
    def test_get_jobs(self):
        """Test get jobs endpoint"""
        response = self.app.get('/api/jobs')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIsInstance(data, list)
    
    def test_register_missing_fields(self):
        """Test registration with missing fields"""
        response = self.app.post('/api/auth/register',
                                 data=json.dumps({}),
                                 content_type='application/json')
        self.assertEqual(response.status_code, 400)
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = self.app.post('/api/auth/login',
                                 data=json.dumps({
                                     'email': 'nonexistent@example.com',
                                     'password': 'wrongpass'
                                 }),
                                 content_type='application/json')
        self.assertEqual(response.status_code, 401)
    
    def test_unauthorized_access(self):
        """Test accessing protected endpoint without token"""
        response = self.app.post('/api/applications',
                                 data=json.dumps({'jobId': 1}),
                                 content_type='application/json')
        self.assertEqual(response.status_code, 401)

if __name__ == '__main__':
    print("🧪 Running JoBika API Integration Tests")
    print("=" * 50)
    unittest.main(verbosity=2)
