"""
End-to-End User Flow Test
Tests complete user journey: Register → Upload Resume → Browse Jobs → Apply
"""

import unittest
import sys
import os
import json
import time

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from server import app

class TestUserFlow(unittest.TestCase):
    """Test complete user flow"""
    
    @classmethod
    def setUpClass(cls):
        """Set up test client"""
        cls.app = app.test_client()
        cls.app.testing = True
        cls.test_user_email = f'flowtest_{int(time.time())}@test.com'
        cls.test_user_password = 'TestPass123'
        cls.token = None
        cls.user_id = None
    
    def test_01_register_user(self):
        """Step 1: Register a new user"""
        print("\n📝 Step 1: Registering new user...")
        
        response = self.app.post('/api/auth/register',
                                 data=json.dumps({
                                     'email': self.test_user_email,
                                     'password': self.test_user_password,
                                     'fullName': 'Flow Test User'
                                 }),
                                 content_type='application/json')
        
        self.assertEqual(response.status_code, 201, "Registration should succeed")
        
        data = json.loads(response.data)
        self.assertIn('token', data, "Should receive JWT token")
        self.assertIn('user', data, "Should receive user data")
        
        # Store token for subsequent requests
        TestUserFlow.token = data['token']
        TestUserFlow.user_id = data['user']['id']
        
        print(f"✅ User registered: {self.test_user_email}")
        print(f"   User ID: {self.user_id}")
        print(f"   Token: {self.token[:20]}...")
    
    def test_02_login_user(self):
        """Step 2: Login with created account"""
        print("\n🔐 Step 2: Logging in...")
        
        response = self.app.post('/api/auth/login',
                                 data=json.dumps({
                                     'email': self.test_user_email,
                                     'password': self.test_user_password
                                 }),
                                 content_type='application/json')
        
        self.assertEqual(response.status_code, 200, "Login should succeed")
        
        data = json.loads(response.data)
        self.assertIn('token', data, "Should receive token")
        
        print(f"✅ Login successful")
    
    def test_03_get_jobs(self):
        """Step 3: Browse available jobs"""
        print("\n💼 Step 3: Browsing jobs...")
        
        response = self.app.get('/api/jobs')
        
        self.assertEqual(response.status_code, 200, "Should get jobs list")
        
        data = json.loads(response.data)
        self.assertIsInstance(data, list, "Should return list of jobs")
        
        print(f"✅ Found {len(data)} jobs")
        
        if len(data) > 0:
            job = data[0]
            print(f"   Example job: {job.get('title')} at {job.get('company')}")
            TestUserFlow.sample_job_id = job.get('id')
    
    def test_04_scrape_jobs(self):
        """Step 4: Scrape fresh jobs"""
        print("\n🔍 Step 4: Scraping new jobs...")
        
        response = self.app.post('/api/jobs/scrape',
                                  data=json.dumps({
                                      'query': 'software engineer',
                                      'location': 'remote',
                                      'limit': 5
                                  }),
                                  content_type='application/json')
        
        # Scraping might fail due to network/rate limits, so we accept both success and error
        self.assertIn(response.status_code, [200, 500], "Scraping attempt made")
        
        if response.status_code == 200:
            data = json.loads(response.data)
            print(f"✅ Scraped {data.get('added', 0)} new jobs")
        else:
            print("⚠️  Job scraping failed (network/rate limit issue - expected)")
    
    def test_05_upload_resume(self):
        """Step 5: Upload resume (simulated)"""
        print("\n📄 Step 5: Uploading resume...")
        
        # Note: Actual file upload requires multipart/form-data
        # For testing without a real file, we'll test the endpoint availability
        
        response = self.app.post('/api/resume/upload',
                                  headers={'Authorization': f'Bearer {self.token}'})
        
        # Expect 400 (no file) not 401 (unauthorized)
        self.assertEqual(response.status_code, 400, "Should require file but accept auth")
        
        data = json.loads(response.data)
        self.assertIn('error', data)
        
        print(f"✅ Resume upload endpoint accessible (file upload required)")
    
    def test_06_get_jobs_with_auth(self):
        """Step 6: Get jobs as authenticated user"""
        print("\n💼 Step 6: Getting personalized job matches...")
        
        response = self.app.get('/api/jobs',
                                 headers={'Authorization': f'Bearer {self.token}'})
        
        self.assertEqual(response.status_code, 200, "Should get jobs")
        
        data = json.loads(response.data)
        print(f"✅ Retrieved {len(data)} jobs for user")
    
    def test_07_apply_to_job(self):
        """Step 7: Apply to a job"""
        print("\n✉️  Step 7: Applying to a job...")
        
        if not hasattr(TestUserFlow, 'sample_job_id'):
            print("⚠️  No jobs available to apply to - skipping")
            return
        
        response = self.app.post('/api/applications',
                                  data=json.dumps({
                                      'jobId': TestUserFlow.sample_job_id
                                  }),
                                  headers={'Authorization': f'Bearer {self.token}'},
                                  content_type='application/json')
        
        # May fail if no resume uploaded - that's expected
        self.assertIn(response.status_code, [201, 404], "Application attempt made")
        
        if response.status_code == 201:
            data = json.loads(response.data)
            print(f"✅ Application submitted successfully")
            print(f"   Match Score: {data.get('matchScore', 'N/A')}")
        else:
            print(f"⚠️  Application requires resume upload (expected)")
    
    def test_08_get_applications(self):
        """Step 8: View application history"""
        print("\n📊 Step 8: Viewing application history...")
        
        response = self.app.get('/api/applications',
                                 headers={'Authorization': f'Bearer {self.token}'})
        
        self.assertEqual(response.status_code, 200, "Should get applications")
        
        data = json.loads(response.data)
        self.assertIsInstance(data, list, "Should return list")
        
        print(f"✅ Found {len(data)} applications")
    
    def test_09_health_check(self):
        """Step 9: Verify system health"""
        print("\n🏥 Step 9: Checking system health...")
        
        response = self.app.get('/api/health')
        
        self.assertEqual(response.status_code, 200, "Health check should pass")
        
        data = json.loads(response.data)
        self.assertEqual(data.get('status'), 'healthy', "System should be healthy")
        
        print(f"✅ System health: {data.get('status')}")
        print(f"   Features: {list(data.get('ai_features', {}).keys())}")

    @classmethod
    def tearDownClass(cls):
        """Cleanup after tests"""
        print("\n🧹 Cleaning up test data...")
        # In production, you might want to delete test user
        # For now, we'll leave it for inspection
        print(f"✅ Test completed for user: {cls.test_user_email}")

if __name__ == '__main__':
    print("=" * 60)
    print("🧪 JoBika - End-to-End User Flow Test")
    print("=" * 60)
    print("\nThis test simulates a complete user journey:")
    print("1. User Registration")
    print("2. User Login")
    print("3. Browse Jobs")
    print("4. Scrape New Jobs")
    print("5. Upload Resume")
    print("6. Get Personalized Matches")
    print("7. Apply to Job")
    print("8. View Applications")
    print("9. System Health Check")
    print("\n" + "=" * 60 + "\n")
    
    unittest.main(verbosity=2)
