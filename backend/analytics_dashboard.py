"""
Advanced Analytics Dashboard for JoBika
Provides insights into job market, applications, and user activity
"""

from datetime import datetime, timedelta
import sqlite3
import json

class AnalyticsDashboard:
    """Advanced analytics and insights"""
    
    def __init__(self, db_path='jobika.db'):
        self.db_path = db_path
    
    def get_db(self):
        """Get database connection"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def get_overview_stats(self, user_id=None):
        """Get overview statistics"""
        conn = self.get_db()
        cursor = conn.cursor()
        
        stats = {}
        
        if user_id:
            # User-specific stats
            cursor.execute('SELECT COUNT(*) as count FROM applications WHERE user_id = ?', (user_id,))
            stats['total_applications'] = cursor.fetchone()['count']
            
            cursor.execute('''
                SELECT COUNT(*) as count FROM applications 
                WHERE user_id = ? AND status = 'interview'
            ''', (user_id,))
            stats['interviews'] = cursor.fetchone()['count']
            
            cursor.execute('''
                SELECT COUNT(*) as count FROM applications 
                WHERE user_id = ? AND status = 'offer'
            ''', (user_id,))
            stats['offers'] = cursor.fetchone()['count']
            
            cursor.execute('''
                SELECT AVG(match_score) as avg_score FROM applications 
                WHERE user_id = ?
            ''', (user_id,))
            result = cursor.fetchone()
            stats['avg_match_score'] = round(result['avg_score'] or 0, 1)
        else:
            # Global stats
            cursor.execute('SELECT COUNT(*) FROM jobs')
            stats['total_jobs'] = cursor.fetchone()[0]
            
            cursor.execute('SELECT COUNT(*) FROM users')
            stats['total_users'] = cursor.fetchone()[0]
            
            cursor.execute('SELECT COUNT(*) FROM applications')
            stats['total_applications'] = cursor.fetchone()[0]
        
        conn.close()
        return stats
    
    def get_application_timeline(self, user_id, days=30):
        """Get application timeline for last N days"""
        conn = self.get_db()
        cursor = conn.cursor()
        
        cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
        
        cursor.execute('''
            SELECT 
                DATE(applied_date) as date,
                COUNT(*) as count
            FROM applications
            WHERE user_id = ? AND applied_date >= ?
            GROUP BY DATE(applied_date)
            ORDER BY date
        ''', (user_id, cutoff_date))
        
        timeline = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return timeline
    
    def get_top_skills_in_demand(self, limit=10):
        """Get most in-demand skills from job postings"""
        conn = self.get_db()
        cursor = conn.cursor()
        
        cursor.execute('SELECT required_skills FROM jobs WHERE required_skills IS NOT NULL')
        all_jobs = cursor.fetchall()
        
        skill_count = {}
        for job in all_jobs:
            try:
                skills = json.loads(job['required_skills'])
                for skill in skills:
                    skill_lower = skill.lower().strip()
                    skill_count[skill_lower] = skill_count.get(skill_lower, 0) + 1
            except:
                continue
        
        # Sort by count
        top_skills = sorted(skill_count.items(), key=lambda x: x[1], reverse=True)[:limit]
        
        conn.close()
        return [{'skill': skill, 'count': count} for skill, count in top_skills]
    
    def get_success_rate_by_match_score(self, user_id):
        """Analyze success rate based on match scores"""
        conn = self.get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT 
                CASE 
                    WHEN match_score >= 80 THEN '80-100'
                    WHEN match_score >= 60 THEN '60-79'
                    WHEN match_score >= 40 THEN '40-59'
                    ELSE '0-39'
                END as score_range,
                COUNT(*) as total,
                SUM(CASE WHEN status IN ('interview', 'offer') THEN 1 ELSE 0 END) as success
            FROM applications
            WHERE user_id = ? AND match_score IS NOT NULL
            GROUP BY score_range
            ORDER BY score_range DESC
        ''', (user_id,))
        
        results = []
        for row in cursor.fetchall():
            total = row['total']
            success = row['success']
            success_rate = (success / total * 100) if total > 0 else 0
            results.append({
                'range': row['score_range'],
                'total': total,
                'success': success,
                'success_rate': round(success_rate, 1)
            })
        
        conn.close()
        return results
    
    def get_job_market_trends(self, days=30):
        """Get job market trends"""
        conn = self.get_db()
        cursor = conn.cursor()
        
        cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
        
        # Jobs by location
        cursor.execute('''
            SELECT location, COUNT(*) as count
            FROM jobs
            WHERE created_at >= ?
            GROUP BY location
            ORDER BY count DESC
            LIMIT 10
        ''', (cutoff_date,))
        locations = [dict(row) for row in cursor.fetchall()]
        
        # Jobs by company
        cursor.execute('''
            SELECT company, COUNT(*) as count
            FROM jobs
            WHERE created_at >= ?
            GROUP BY company
            ORDER BY count DESC
            LIMIT 10
        ''', (cutoff_date,))
        companies = [dict(row) for row in cursor.fetchall()]
        
        # Average salary by location (if available)
        trends = {
            'top_locations': locations,
            'top_companies': companies
        }
        
        conn.close()
        return trends
    
    def get_user_skill_gaps(self, user_id):
        """Get aggregated skill gaps for user"""
        conn = self.get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT missing_skills, matching_skills
            FROM skill_gaps
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT 20
        ''', (user_id,))
        
        gaps = cursor.fetchall()
        
        # Aggregate missing skills
        all_missing = {}
        all_matching = {}
        
        for gap in gaps:
            try:
                if gap['missing_skills']:
                    missing = json.loads(gap['missing_skills'])
                    for skill in missing:
                        skill_lower = skill.lower().strip()
                        all_missing[skill_lower] = all_missing.get(skill_lower, 0) + 1
                
                if gap['matching_skills']:
                    matching = json.loads(gap['matching_skills'])
                    for skill in matching:
                        skill_lower = skill.lower().strip()
                        all_matching[skill_lower] = all_matching.get(skill_lower, 0) + 1
            except:
                continue
        
        # Get top missing skills
        top_missing = sorted(all_missing.items(), key=lambda x: x[1], reverse=True)[:10]
        top_matching = sorted(all_matching.items(), key=lambda x: x[1], reverse=True)[:10]
        
        result = {
            'top_missing_skills': [{'skill': s, 'frequency': c} for s, c in top_missing],
            'top_matching_skills': [{'skill': s, 'frequency': c} for s, c in top_matching]
        }
        
        conn.close()
        return result
    
    def get_application_funnel(self, user_id):
        """Get application funnel (applied → interview → offer)"""
        conn = self.get_db()
        cursor = conn.cursor()
        
        funnel = {}
        
        statuses = ['applied', 'interview', 'offer', 'rejected']
        for status in statuses:
            cursor.execute('''
                SELECT COUNT(*) as count
                FROM applications
                WHERE user_id = ? AND status = ?
            ''', (user_id, status))
            funnel[status] = cursor.fetchone()['count']
        
        conn.close()
        return funnel
    
    def get_recommendations(self, user_id):
        """Get personalized recommendations"""
        conn = self.get_db()
        cursor = conn.cursor()
        
        recommendations = []
        
        # Check application rate
        cursor.execute('''
            SELECT COUNT(*) as count FROM applications
            WHERE user_id = ? AND applied_date >= date('now', '-7 days')
        ''', (user_id,))
        weekly_apps = cursor.fetchone()['count']
        
        if weekly_apps < 5:
            recommendations.append({
                'type': 'action',
                'title': 'Increase Application Rate',
                'description': f'You\'ve only applied to {weekly_apps} jobs this week. Try to apply to at least 10-15 jobs per week for better results.',
                'priority': 'high'
            })
        
        # Check match scores
        cursor.execute('''
            SELECT AVG(match_score) as avg_score
            FROM applications
            WHERE user_id = ?
        ''', (user_id,))
        avg_score = cursor.fetchone()['avg_score'] or 0
        
        if avg_score < 60:
            recommendations.append({
                'type': 'skill',
                'title': 'Improve Skill Match',
                'description': f'Your average match score is {avg_score:.0f}%. Consider learning high-demand skills to improve your match with jobs.',
                'priority': 'high'
            })
        
        # Check resume versions
        cursor.execute('''
            SELECT COUNT(*) as count FROM resume_versions
            WHERE user_id = ?
        ''', (user_id,))
        versions = cursor.fetchone()['count']
        
        if versions == 0:
            recommendations.append({
                'type': 'action',
                'title': 'Customize Your Resume',
                'description': 'Try customizing your resume for specific jobs to increase your chances of getting interviews.',
                'priority': 'medium'
            })
        
        conn.close()
        return recommendations

# Global instance
analytics = AnalyticsDashboard()

def init_analytics_endpoints(app):
    """Initialize analytics endpoints"""
    from flask import jsonify, request
    
    @app.route('/api/analytics/overview')
    def analytics_overview():
        """Get overview statistics"""
        from server import verify_token
        
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        user_id = verify_token(token)
        
        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401
        
        stats = analytics.get_overview_stats(user_id)
        return jsonify(stats)
    
    @app.route('/api/analytics/timeline')
    def analytics_timeline():
        """Get application timeline"""
        from server import verify_token
        
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        user_id = verify_token(token)
        
        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401
        
        days = int(request.args.get('days', 30))
        timeline = analytics.get_application_timeline(user_id, days)
        return jsonify(timeline)
    
    @app.route('/api/analytics/skills')
    def analytics_skills():
        """Get top skills in demand"""
        limit = int(request.args.get('limit', 10))
        skills = analytics.get_top_skills_in_demand(limit)
        return jsonify(skills)
    
    @app.route('/api/analytics/success-rate')
    def analytics_success_rate():
        """Get success rate by match score"""
        from server import verify_token
        
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        user_id = verify_token(token)
        
        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401
        
        rates = analytics.get_success_rate_by_match_score(user_id)
        return jsonify(rates)
    
    @app.route('/api/analytics/trends')
    def analytics_trends():
        """Get job market trends"""
        days = int(request.args.get('days', 30))
        trends = analytics.get_job_market_trends(days)
        return jsonify(trends)
    
    @app.route('/api/analytics/skill-gaps')
    def analytics_skill_gaps():
        """Get user skill gaps"""
        from server import verify_token
        
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        user_id = verify_token(token)
        
        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401
        
        gaps = analytics.get_user_skill_gaps(user_id)
        return jsonify(gaps)
    
    @app.route('/api/analytics/funnel')
    def analytics_funnel():
        """Get application funnel"""
        from server import verify_token
        
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        user_id = verify_token(token)
        
        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401
        
        funnel = analytics.get_application_funnel(user_id)
        return jsonify(funnel)
    
    @app.route('/api/analytics/recommendations')
    def analytics_recommendations():
        """Get personalized recommendations"""
        from server import verify_token
        
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        user_id = verify_token(token)
        
        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401
        
        recs = analytics.get_recommendations(user_id)
        return jsonify(recs)
    
    print("✅ Analytics endpoints initialized")
