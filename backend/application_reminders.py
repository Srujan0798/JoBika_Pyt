"""
Application Reminders System for JoBika
Send reminders for pending applications
"""

from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
import sqlite3

class ApplicationReminderSystem:
    """Automated application reminders"""
    
    def __init__(self, db_path='jobika.db'):
        self.db_path = db_path
        self.scheduler = None
    
    def get_db(self):
        """Get database connection"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def check_and_send_reminders(self):
        """Check for applications needing reminders"""
        print(f"🔔 Checking application reminders at {datetime.now()}")
        
        conn = self.get_db()
        cursor = conn.cursor()
        
        try:
            # Applications with no response after 7 days
            week_ago = (datetime.now() - timedelta(days=7)).isoformat()
            
            cursor.execute('''
                SELECT a.*, u.email, u.full_name, j.title as job_title, j.company
                FROM applications a
                JOIN users u ON a.user_id = u.id
                JOIN jobs j ON a.job_id = j.id
                WHERE a.status = 'applied'
                AND a.applied_date <= ?
                AND a.applied_date >= ?
            ''', (week_ago, (datetime.now() - timedelta(days=14)).isoformat()))
            
            applications = cursor.fetchall()
            
            print(f"📧 Found {len(applications)} applications needing follow-up")
            
            for app in applications:
                self._send_reminder_email(app)
            
            # Applications in interview stage for >14 days
            two_weeks_ago = (datetime.now() - timedelta(days=14)).isoformat()
            
            cursor.execute('''
                SELECT a.*, u.email, u.full_name, j.title as job_title, j.company
                FROM applications a
                JOIN users u ON a.user_id = u.id
                JOIN jobs j ON a.job_id = j.id
                WHERE a.status = 'interview'
                AND a.applied_date <= ?
            ''', (two_weeks_ago,))
            
            interview_apps = cursor.fetchall()
            
            for app in interview_apps:
                self._send_interview_reminder(app)
            
        except Exception as e:
            print(f"❌ Error checking reminders: {e}")
        finally:
            conn.close()
    
    def _send_reminder_email(self, application):
        """Send follow-up reminder email"""
        try:
            from email_service import send_email
            
            subject = f"Follow-up reminder: {application['job_title']} at {application['company']}"
            
            body = f"""
Hi {application['full_name']},

It's been a week since you applied to {application['job_title']} at {application['company']}.

Consider following up with the hiring manager to express your continued interest.

Tips for follow-up:
- Send a brief, polite email
- Reiterate your interest in the role
- Highlight 1-2 key qualifications
- Ask about the timeline

Good luck! 🍀

Best regards,
JoBika Team
"""
            
            send_email(application['email'], subject, body)
            print(f"📧 Sent reminder to {application['email']}")
            
        except Exception as e:
            print(f"❌ Failed to send reminder: {e}")
    
    def _send_interview_reminder(self, application):
        """Send interview stage reminder"""
        try:
            from email_service import send_email
            
            subject = f"Interview follow-up: {application['job_title']}"
            
            body = f"""
Hi {application['full_name']},

Your application to {application['job_title']} at {application['company']} has been in interview stage for 2 weeks.

Consider:
- Following up on interview outcomes
- Sending a thank-you note if you haven't
- Asking about next steps

Stay positive and keep applying!

Best regards,
JoBika Team
"""
            
            send_email(application['email'], subject, body)
            
        except Exception as e:
            print(f"❌ Failed to send interview reminder: {e}")
    
    def start_scheduler(self):
        """Start reminder scheduler"""
        if self.scheduler:
            return
        
        self.scheduler = BackgroundScheduler()
        
        # Run daily at 9 AM
        self.scheduler.add_job(
            self.check_and_send_reminders,
            'cron',
            hour=9,
            minute=0
        )
        
        self.scheduler.start()
        print("✅ Application reminders scheduler started (runs daily at 9 AM)")
    
    def stop_scheduler(self):
        """Stop scheduler"""
        if self.scheduler:
            self.scheduler.shutdown()
            self.scheduler = None

# Global instance
app_reminders = ApplicationReminderSystem()

def init_application_reminders(app):
    """Initialize application reminders"""
    from flask import request, jsonify
    
    # Start scheduler
    app_reminders.start_scheduler()
    
    @app.route('/api/reminders/status')
    def reminder_status():
        """Get reminder system status"""
        return jsonify({
            'enabled': app_reminders.scheduler is not None,
            'schedule': 'Daily at 9:00 AM'
        })
    
    print("✅ Application reminders initialized")

# Cleanup
import atexit
atexit.register(lambda: app_reminders.stop_scheduler())
