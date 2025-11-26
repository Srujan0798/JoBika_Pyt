"""
Job Alerts System for JoBika
Email notifications for new matching jobs
"""

from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
import sqlite3
import json

class JobAlertsSystem:
    """Automated job alerts via email"""
    
    def __init__(self, db_path='jobika.db'):
        self.db_path = db_path
        self.scheduler = None
    
    def get_db(self):
        """Get database connection"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def check_and_send_alerts(self):
        """Check for new jobs and send alerts to matching users"""
        print(f"🔔 Running job alerts check at {datetime.now()}")
        
        conn = self.get_db()
        cursor = conn.cursor()
        
        try:
            # Get all users with preferences enabled
            cursor.execute('''
                SELECT u.id, u.email, u.full_name, p.auto_apply_enabled,
                       p.preferred_locations, p.min_salary, p.preferred_roles
                FROM users u
                LEFT JOIN user_preferences p ON u.id = p.user_id
                WHERE p.auto_apply_enabled = 1
            ''')
            
            users = cursor.fetchall()
            print(f"📧 Found {len(users)} users with alerts enabled")
            
            # Get jobs from last 24 hours
            yesterday = (datetime.now() - timedelta(days=1)).isoformat()
            cursor.execute('''
                SELECT * FROM jobs
                WHERE created_at >= ?
                ORDER BY created_at DESC
            ''', (yesterday,))
            
            new_jobs = cursor.fetchall()
            print(f"💼 Found {len(new_jobs)} new jobs in last 24 hours")
            
            if not new_jobs:
                conn.close()
                return
            
            alerts_sent = 0
            
            for user in users:
                matching_jobs = self._find_matching_jobs(user, new_jobs)
                
                if matching_jobs:
                    self._send_alert_email(user, matching_jobs)
                    alerts_sent += 1
            
            print(f"✅ Sent {alerts_sent} job alert emails")
            
        except Exception as e:
            print(f"❌ Error in job alerts: {e}")
        finally:
            conn.close()
    
    def _find_matching_jobs(self, user, jobs):
        """Find jobs matching user preferences"""
        matching = []
        
        # Parse user preferences
        preferred_locations = json.loads(user['preferred_locations']) if user['preferred_locations'] else []
        preferred_roles = json.loads(user['preferred_roles']) if user['preferred_roles'] else []
        min_salary = user['min_salary'] or 0
        
        for job in jobs:
            # Location match
            if preferred_locations:
                location_match = any(
                    loc.lower() in (job['location'] or '').lower()
                    for loc in preferred_locations
                )
                if not location_match and job['location'] not in ['Remote', 'Anywhere']:
                    continue
            
            # Role match
            if preferred_roles:
                role_match = any(
                    role.lower() in (job['title'] or '').lower()
                    for role in preferred_roles
                )
                if not role_match:
                    continue
            
            # Salary match (if salary info available)
            # Note: Salary parsing would be more complex in real implementation
            
            matching.append(job)
            
            # Limit to top 5 matches per alert
            if len(matching) >= 5:
                break
        
        return matching
    
    def _send_alert_email(self, user, jobs):
        """Send email alert to user"""
        try:
            from email_service import send_job_alert
            
            job_list = []
            for job in jobs:
                job_list.append({
                    'title': job['title'],
                    'company': job['company'],
                    'location': job['location'],
                    'url': job['url']
                })
            
            send_job_alert(
                user['email'],
                user['full_name'],
                job_list
            )
            
            print(f"📧 Sent alert to {user['email']} with {len(jobs)} jobs")
            
        except Exception as e:
            print(f"❌ Failed to send alert to {user['email']}: {e}")
    
    def start_scheduler(self):
        """Start background scheduler for job alerts"""
        if self.scheduler:
            return
        
        self.scheduler = BackgroundScheduler()
        
        # Run alerts check twice daily (8 AM and 6 PM)
        self.scheduler.add_job(
            self.check_and_send_alerts,
            'cron',
            hour='8,18',
            minute=0
        )
        
        # For testing: also run every hour
        # self.scheduler.add_job(
        #     self.check_and_send_alerts,
        #     'interval',
        #     hours=1
        # )
        
        self.scheduler.start()
        print("✅ Job alerts scheduler started (runs at 8 AM and 6 PM daily)")
    
    def stop_scheduler(self):
        """Stop the scheduler"""
        if self.scheduler:
            self.scheduler.shutdown()
            self.scheduler = None
            print("🛑 Job alerts scheduler stopped")
    
    def send_manual_alert(self, user_id):
        """Manually trigger alert for a specific user"""
        conn = self.get_db()
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                SELECT u.id, u.email, u.full_name, p.auto_apply_enabled,
                       p.preferred_locations, p.min_salary, p.preferred_roles
                FROM users u
                LEFT JOIN user_preferences p ON u.id = p.user_id
                WHERE u.id = ?
            ''', (user_id,))
            
            user = cursor.fetchone()
            
            if not user:
                return {'success': False, 'error': 'User not found'}
            
            # Get recent jobs
            week_ago = (datetime.now() - timedelta(days=7)).isoformat()
            cursor.execute('''
                SELECT * FROM jobs
                WHERE created_at >= ?
                ORDER BY created_at DESC
            ''', (week_ago,))
            
            jobs = cursor.fetchall()
            matching_jobs = self._find_matching_jobs(user, jobs)
            
            if matching_jobs:
                self._send_alert_email(user, matching_jobs)
                return {
                    'success': True,
                    'jobs_sent': len(matching_jobs)
                }
            else:
                return {
                    'success': True,
                    'jobs_sent': 0,
                    'message': 'No matching jobs found'
                }
                
        except Exception as e:
            return {'success': False, 'error': str(e)}
        finally:
            conn.close()

# Global instance
job_alerts = JobAlertsSystem()

def init_job_alerts(app):
    """Initialize job alerts system"""
    from flask import request, jsonify
    
    # Start scheduler
    job_alerts.start_scheduler()
    
    @app.route('/api/alerts/test', methods=['POST'])
    def test_alert():
        """Send test alert to current user"""
        from server import verify_token
        
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        user_id = verify_token(token)
        
        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401
        
        result = job_alerts.send_manual_alert(user_id)
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 500
    
    @app.route('/api/alerts/status')
    def alerts_status():
        """Get alerts system status"""
        return jsonify({
            'enabled': job_alerts.scheduler is not None,
            'next_run': '8:00 AM and 6:00 PM daily'
        })
    
    print("✅ Job alerts initialized")

# Cleanup on app shutdown
import atexit
atexit.register(lambda: job_alerts.stop_scheduler())
