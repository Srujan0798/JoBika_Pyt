# JoBika Backend Server - Complete with AI Agent Features
# Python Flask + SQLite Implementation

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from apscheduler.schedulers.background import BackgroundScheduler
import sqlite3
import hashlib
import jwt
import datetime
import os
import json
from werkzeug.utils import secure_filename
import re

# Import custom modules
from resume_parser import (
    parse_pdf, parse_docx, extract_email, extract_phone, extract_name,
    extract_skills, extract_experience_years, enhance_resume_text,
    calculate_match_score, generate_skill_recommendations
)
from job_scraper import scrape_jobs, extract_skills_from_job
from email_service import (
    init_mail, send_welcome_email, send_application_confirmation,
    send_job_alert, send_skill_recommendation_email
)
from resume_customizer import ResumeCustomizer, SkillGapAnalyzer
from job_scraper_universal import UniversalJobScraper, AutoApplySystem

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
SECRET_KEY = 'your-secret-key-change-in-production'
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf', 'docx', 'doc'}

# Initialize email service
try:
    mail = init_mail(app)
    print("✅ Email service initialized")
except Exception as e:
    print(f"⚠️  Email service not configured: {e}")
    mail = None

# Initialize AI modules
resume_customizer = ResumeCustomizer()
skill_analyzer = SkillGapAnalyzer()
job_scraper = UniversalJobScraper()

# Ensure upload folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Database helper functions
def get_db():
    conn = sqlite3.connect('jobika.db')
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize database with all tables"""
    conn = sqlite3.connect('jobika.db')
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        full_name TEXT,
        phone TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')
    
    # Resumes table
    cursor.execute('''CREATE TABLE IF NOT EXISTS resumes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        filename TEXT,
        original_text TEXT,
        enhanced_text TEXT,
        skills TEXT,
        experience_years INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )''')
    
    # Jobs table
    cursor.execute('''CREATE TABLE IF NOT EXISTS jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        company TEXT NOT NULL,
        location TEXT,
        salary TEXT,
        description TEXT,
        required_skills TEXT,
        posted_date TEXT,
        source TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')
    
    # Applications table
    cursor.execute('''CREATE TABLE IF NOT EXISTS applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        job_id INTEGER NOT NULL,
        resume_id INTEGER,
        status TEXT DEFAULT 'applied',
        match_score INTEGER,
        applied_date TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (job_id) REFERENCES jobs(id),
        FOREIGN KEY (resume_id) REFERENCES resumes(id)
    )''')
    
    conn.commit()
    conn.close()
    print("✅ Database initialized")

# Initialize database on startup
init_db()

# Helper functions
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def verify_token(token):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return payload['user_id']
    except:
        return None

# ============= AUTHENTICATION ENDPOINTS =============

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register new user"""
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        full_name = data.get('fullName', '')
        phone = data.get('phone', '')
        
        if not email or not password:
            return jsonify({'error': 'Email and password required'}), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Check if user exists
        cursor.execute('SELECT id FROM users WHERE email = ?', (email,))
        if cursor.fetchone():
            conn.close()
            return jsonify({'error': 'Email already registered'}), 400
        
        # Create user
        hashed_password = hash_password(password)
        cursor.execute('''
            INSERT INTO users (email, password, full_name, phone)
            VALUES (?, ?, ?, ?)
        ''', (email, hashed_password, full_name, phone))
        conn.commit()
        user_id = cursor.lastrowid
        
        # Generate JWT token
        token = jwt.encode({
            'user_id': user_id,
            'email': email,
            'exp': datetime.datetime.utcnow() + datetime.datetime.timedelta(days=7)
        }, SECRET_KEY, algorithm='HS256')
        
        # Send welcome email
        try:
            send_welcome_email(email, full_name or 'User')
            print(f"✅ Welcome email sent to {email}")
        except Exception as e:
            print(f"⚠️  Could not send welcome email: {e}")
        
        conn.close()
        
        return jsonify({
            'token': token,
            'user': {
                'id': user_id,
                'email': email,
                'fullName': full_name,
                'phone': phone
            }
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login user"""
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'error': 'Email and password required'}), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        hashed_password = hash_password(password)
        cursor.execute('''
            SELECT id, email, full_name, phone
            FROM users
            WHERE email = ? AND password = ?
        ''', (email, hashed_password))
        
        user = cursor.fetchone()
        conn.close()
        
        if not user:
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Generate JWT token
        token = jwt.encode({
            'user_id': user['id'],
            'email': user['email'],
            'exp': datetime.datetime.utcnow() + datetime.datetime.timedelta(days=7)
        }, SECRET_KEY, algorithm='HS256')
        
        return jsonify({
            'token': token,
            'user': {
                'id': user['id'],
                'email': user['email'],
                'fullName': user['full_name'],
                'phone': user['phone']
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============= RESUME ENDPOINTS =============

@app.route('/api/resume/upload', methods=['POST'])
def upload_resume():
    """Upload and parse resume"""
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        user_id = verify_token(token)
        
        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401
        
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Save file
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, f"{user_id}_{filename}")
        file.save(filepath)
        
        # Parse file
        original_text = None
        if filename.lower().endswith('.pdf'):
            original_text = parse_pdf(filepath)
        elif filename.lower().endswith(('.docx', '.doc')):
            original_text = parse_docx(filepath)
        else:
            return jsonify({'error': 'Unsupported file format'}), 400
        
        if not original_text:
            return jsonify({'error': 'Failed to parse resume'}), 500
        
        # Extract information
        email = extract_email(original_text)
        phone = extract_phone(original_text)
        name = extract_name(original_text)
        skills = extract_skills(original_text)
        experience_years = extract_experience_years(original_text)
        
        # Enhance text
        enhanced_text = enhance_resume_text(original_text)
        
        # Store resume
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO resumes (user_id, filename, original_text, enhanced_text, skills, experience_years)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (user_id, filename, original_text, enhanced_text, json.dumps(skills), experience_years))
        conn.commit()
        resume_id = cursor.lastrowid
        conn.close()
        
        return jsonify({
            'id': resume_id,
            'filename': filename,
            'skills': skills,
            'experienceYears': experience_years,
            'extractedInfo': {
                'name': name,
                'email': email,
                'phone': phone
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============= NEW: RESUME CUSTOMIZATION ENDPOINTS =============

@app.route('/api/resume/customize', methods=['POST'])
def customize_resume():
    """Create customized resume for specific job"""
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        user_id = verify_token(token)
        
        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401
        
        data = request.json
        job_id = data.get('jobId')
        
        # Get user's base resume
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM resumes
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT 1
        ''', (user_id,))
        
        resume = cursor.fetchone()
        if not resume:
            conn.close()
            return jsonify({'error': 'No resume found'}), 404
        
        # Get job details
        cursor.execute('SELECT * FROM jobs WHERE id = ?', (job_id,))
        job = cursor.fetchone()
        
        if not job:
            conn.close()
            return jsonify({'error': 'Job not found'}), 404
        
        # Prepare base resume data
        base_resume = {
            'name': resume['filename'],
            'skills': json.loads(resume['skills']) if resume['skills'] else [],
            'experience_years': resume['experience_years'],
            'original_text': resume['original_text']
        }
        
        # Customize resume
        customized = resume_customizer.customize_resume_for_job(
            base_resume,
            job['description'],
            job['title']
        )
        
        # Store customized version
        version_name = f"Resume - {job['title']} - {job['company']}"
        
        cursor.execute('''
            INSERT INTO resume_versions 
            (user_id, base_resume_id, job_id, version_name, customized_summary, customized_skills, match_score)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            user_id,
            resume['id'],
            job_id,
            version_name,
            customized['summary'],
            json.dumps(customized['skills']),
            customized['match_score']
        ))
        conn.commit()
        version_id = cursor.lastrowid
        conn.close()
        
        return jsonify({
            'versionId': version_id,
            'versionName': version_name,
            'customized': customized
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/resume/skill-gap', methods=['POST'])
def analyze_skill_gap():
    """Analyze skill gap for a job"""
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        user_id = verify_token(token)
        
        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401
        
        data = request.json
        job_id = data.get('jobId')
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Get user's skills
        cursor.execute('''
            SELECT skills FROM resumes
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT 1
        ''', (user_id,))
        
        resume = cursor.fetchone()
        if not resume:
            conn.close()
            return jsonify({'error': 'No resume found'}), 404
        
        user_skills = json.loads(resume['skills']) if resume['skills'] else []
        
        # Get job requirements
        cursor.execute('SELECT * FROM jobs WHERE id = ?', (job_id,))
        job = cursor.fetchone()
        
        if not job:
            conn.close()
            return jsonify({'error': 'Job not found'}), 404
        
        job_skills = json.loads(job['required_skills']) if job['required_skills'] else []
        
        # Analyze skill gap
        analysis = skill_analyzer.analyze_skill_gap(user_skills, job_skills, job['title'])
        
        # Store analysis
        cursor.execute('''
            INSERT INTO skill_gaps
            (user_id, job_id, matching_skills, missing_skills, match_score, recommendations)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            user_id,
            job_id,
            json.dumps(analysis['matching_skills']),
            json.dumps(analysis['missing_skills']),
            analysis['match_score'],
            json.dumps(analysis['recommendations'])
        ))
        conn.commit()
        conn.close()
        
        return jsonify(analysis)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============= JOB ENDPOINTS =============

@app.route('/api/jobs', methods=['GET'])
def get_jobs():
    """Get all jobs"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        location = request.args.get('location')
        query = 'SELECT * FROM jobs WHERE 1=1'
        params = []
        
        if location and location != 'All Locations':
            query += ' AND location LIKE ?'
            params.append(f'%{location}%')
        
        query += ' ORDER BY created_at DESC LIMIT 50'
        
        cursor.execute(query, params)
        jobs = cursor.fetchall()
        conn.close()
        
        result = []
        for job in jobs:
            result.append({
                'id': job['id'],
                'title': job['title'],
                'company': job['company'],
                'location': job['location'],
                'salary': job['salary'],
                'description': job['description'],
                'skills': json.loads(job['required_skills']) if job['required_skills'] else [],
                'posted': job['posted_date'],
                'source': job['source']
            })
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/jobs/scrape', methods=['POST'])
def scrape_jobs_endpoint():
    """Scrape fresh jobs from job boards"""
    try:
        data = request.json or {}
        query = data.get('query', 'software engineer')
        location = data.get('location', 'remote')
        limit = data.get('limit', 20)
        
        # Scrape jobs using universal scraper
        scraped_jobs = job_scraper.scrape_all_jobs(query, location, limit)
        
        # Store in database
        conn = get_db()
        cursor = conn.cursor()
        
        added_count = 0
        for job in scraped_jobs:
            # Check if job already exists
            cursor.execute('''
                SELECT id FROM jobs
                WHERE title = ? AND company = ?
            ''', (job['title'], job['company']))
            
            if cursor.fetchone():
                continue  # Skip duplicates
            
            cursor.execute('''
                INSERT INTO jobs (title, company, location, salary, description, required_skills, posted_date, source)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                job['title'],
                job['company'],
                job['location'],
                job.get('salary', 'Not disclosed'),
                job.get('description', ''),
                json.dumps(job.get('skills_required', [])),
                job.get('posted_date', 'Recently'),
                job['source']
            ))
            added_count += 1
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'message': f'Scraped {len(scraped_jobs)} jobs, added {added_count} new jobs',
            'scraped': len(scraped_jobs),
            'added': added_count,
            'jobs': scraped_jobs
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============= APPLICATION ENDPOINTS =============

@app.route('/api/applications', methods=['POST'])
def create_application():
    """Create job application"""
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        user_id = verify_token(token)
        
        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401
        
        data = request.json
        job_id = data.get('jobId')
        resume_version_id = data.get('resumeVersionId')
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Get job and resume
        cursor.execute('SELECT * FROM jobs WHERE id = ?', (job_id,))
        job = cursor.fetchone()
        
        cursor.execute('''
            SELECT * FROM resumes
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT 1
        ''', (user_id,))
        resume = cursor.fetchone()
        
        if not job or not resume:
            conn.close()
            return jsonify({'error': 'Job or resume not found'}), 404
        
        # Calculate match score
        resume_skills = json.loads(resume['skills']) if resume['skills'] else []
        job_skills = json.loads(job['required_skills']) if job['required_skills'] else []
        match_score = calculate_match_score(resume_skills, job_skills)
        
        # Create application
        cursor.execute('''
            INSERT INTO applications (user_id, job_id, resume_id, status, match_score, applied_date)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (user_id, job_id, resume['id'], 'applied', match_score, datetime.datetime.now().isoformat()))
        conn.commit()
        application_id = cursor.lastrowid
        
        # Send application confirmation email
        try:
            cursor.execute('SELECT email, full_name FROM users WHERE id = ?', (user_id,))
            user_data = cursor.fetchone()
            if user_data:
                send_application_confirmation(
                    user_data['email'],
                    user_data['full_name'] or 'User',
                    job['title'],
                    job['company'],
                    match_score
                )
                print(f"✅ Application confirmation sent to {user_data['email']}")
        except Exception as e:
            print(f"⚠️  Could not send application confirmation: {e}")
        
        conn.close()
        
        return jsonify({
            'id': application_id,
            'jobId': job_id,
            'status': 'applied',
            'matchScore': match_score,
            'appliedDate': datetime.datetime.now().isoformat()
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/applications', methods=['GET'])
def get_applications():
    """Get user's applications"""
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        user_id = verify_token(token)
        
        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT a.*, j.title, j.company, j.location
            FROM applications a
            JOIN jobs j ON a.job_id = j.id
            WHERE a.user_id = ?
            ORDER BY a.applied_date DESC
        ''', (user_id,))
        
        applications = cursor.fetchall()
        conn.close()
        
        result = []
        for app in applications:
            result.append({
                'id': app['id'],
                'jobId': app['job_id'],
                'position': app['title'],
                'company': app['company'],
                'location': app['location'],
                'status': app['status'],
                'matchScore': app['match_score'],
                'appliedDate': app['applied_date']
            })
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============= UTILITY ENDPOINTS =============

@app.route('/api/health', methods=['GET'])
def health():
    """Health check"""
    return jsonify({
        'status': 'ok',
        'message': 'JoBika API is running',
        'features': {
            'resume_customization': True,
            'skill_gap_analysis': True,
            'universal_job_scraping': True,
            'email_notifications': mail is not None
        }
    })

@app.route('/api/seed', methods=['POST'])
def seed_database():
    """Seed database with sample jobs"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Check if jobs already exist
        cursor.execute('SELECT COUNT(*) as count FROM jobs')
        if cursor.fetchone()['count'] > 0:
            conn.close()
            return jsonify({'message': 'Database already seeded'})
        
        # Use universal scraper to get sample jobs
        sample_jobs = job_scraper.scrape_all_jobs('software engineer', 'remote', 20)
        
        for job in sample_jobs:
            cursor.execute('''
                INSERT INTO jobs (title, company, location, salary, description, required_skills, posted_date, source)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                job['title'],
                job['company'],
                job['location'],
                job.get('salary', 'Not disclosed'),
                job.get('description', ''),
                json.dumps(job.get('skills_required', [])),
                job.get('posted_date', 'Recently'),
                job['source']
            ))
        
        conn.commit()
        conn.close()
        
        return jsonify({'message': f'Database seeded with {len(sample_jobs)} jobs'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============= AUTO-APPLY CRON JOB =============

def run_auto_apply_for_all_users():
    """Background job to run auto-apply for all users"""
    print("🤖 Running auto-apply for all users...")
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Get users with auto-apply enabled
        cursor.execute('''
            SELECT user_id FROM user_preferences
            WHERE auto_apply_enabled = 1
        ''')
        
        users = cursor.fetchall()
        conn.close()
        
        auto_apply_system = AutoApplySystem(None)
        
        for user in users:
            try:
                result = auto_apply_system.process_auto_apply_for_user(user['user_id'])
                print(f"✅ Auto-applied {result['applications']} jobs for user {user['user_id']}")
            except Exception as e:
                print(f"❌ Auto-apply failed for user {user['user_id']}: {e}")
        
        print("✅ Auto-apply completed for all users")
        
    except Exception as e:
        print(f"❌ Auto-apply job failed: {e}")

# Initialize scheduler
scheduler = BackgroundScheduler()
scheduler.add_job(func=run_auto_apply_for_all_users, trigger="cron", hour=9)  # Run daily at 9 AM
scheduler.start()

# Serve frontend
@app.route('/')
def serve_frontend():
    return send_from_directory('../app', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('../app', path)

if __name__ == '__main__':
    print("🚀 JoBika Server Starting...")
    print("✅ Resume customization enabled")
    print("✅ Skill gap analysis enabled")
    print("✅ Universal job scraping enabled")
    print("✅ Auto-apply cron job scheduled (daily at 9 AM)")
    print("🌐 Server running on http://localhost:5000")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
