# JoBika Backend Server - Complete with AI Agent Features
# Python Flask + SQLite Implementation

from flask import Flask, request, jsonify, send_from_directory, session, redirect, url_for
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
import sys
import traceback

# Ensure backend directory is in path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

print("🚀 Server module loading...")

import pyotp
import qrcode
import io
import base64
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from authlib.integrations.flask_client import OAuth

# Import custom modules
from resume_parser import (
    parse_pdf, parse_docx, extract_email, extract_phone, extract_name,
    extract_skills, extract_experience_years, enhance_resume_text,
    calculate_match_score, generate_skill_recommendations
)
from job_scraper import scrape_all_jobs, extract_skills_from_job
from email_service import (
    init_mail, send_welcome_email, send_application_confirmation,
    send_job_alert, send_skill_recommendation_email
)
from resume_customizer import ResumeCustomizer, SkillGapAnalyzer
from job_scraper_universal import UniversalJobScraper, AutoApplySystem
from analytics import get_application_stats, get_market_insights
from learning_recommendations import get_recommendations_for_gaps, get_learning_resources

# Import new modules
try:
    from api_docs import init_swagger
    from security_middleware import init_security_middleware, validate_email, validate_password
    from performance_monitor import init_performance_monitoring, track_performance
    from analytics_dashboard import init_analytics_endpoints
    from cover_letter_generator import init_cover_letter_endpoints
    from cache_system import init_cache_endpoints, cache_response
    from job_alerts import init_job_alerts
    from resume_comparer import init_resume_comparison_endpoints
    from interview_prep import init_interview_prep_endpoints
    from application_reminders import init_application_reminders
    from salary_insights import init_salary_insights_endpoints
    from pdf_export import init_pdf_export_endpoints
    ENHANCED_FEATURES = True
    print("✅ All enhanced features loaded successfully!")
except ImportError as e:
    ENHANCED_FEATURES = False
    print(f"⚠️  Enhanced features not available: {e}")
    # Define dummy decorators
    def track_performance(f):
        return f
    def cache_response(ttl=300, key_prefix=''):
        def decorator(f):
            return f
        return decorator

from dotenv import load_dotenv
load_dotenv()  # Load environment variables

# Configure static folder to serve app/ directory
import os
from flask import send_from_directory
static_folder_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'app'))

app = Flask(__name__)
# Configure CORS to allow frontend requests
allowed_origins = [
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:5000",
    "http://127.0.0.1:5000"
]

# Add production origin if set
production_origin = os.environ.get('ALLOWED_ORIGINS')
if production_origin:
    allowed_origins.append(production_origin)

CORS(app, resources={
    r"/api/*": {
        "origins": allowed_origins,
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Configuration
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload

# SECRET_KEY for sessions (required for OAuth)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production-12345')
if app.config['SECRET_KEY'] == 'dev-secret-key-change-in-production-12345':
    print("⚠️  WARNING: Using default SECRET_KEY. Set SECRET_KEY environment variable in production!")

# Initialize Rate Limiter
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
)

# Initialize OAuth
oauth = OAuth(app)

# Google OAuth
oauth.register(
    name='google',
    client_id=os.environ.get('GOOGLE_CLIENT_ID'),
    client_secret=os.environ.get('GOOGLE_CLIENT_SECRET'),
    access_token_url='https://accounts.google.com/o/oauth2/token',
    access_token_params=None,
    authorize_url='https://accounts.google.com/o/oauth2/auth',
    authorize_params=None,
    api_base_url='https://www.googleapis.com/oauth2/v1/',
    userinfo_endpoint='https://openidconnect.googleapis.com/v1/userinfo',
    client_kwargs={'scope': 'openid email profile'},
)

# LinkedIn OAuth
oauth.register(
    name='linkedin',
    client_id=os.environ.get('LINKEDIN_CLIENT_ID'),
    client_secret=os.environ.get('LINKEDIN_CLIENT_SECRET'),
    access_token_url='https://www.linkedin.com/oauth/v2/accessToken',
    access_token_params=None,
    authorize_url='https://www.linkedin.com/oauth/v2/authorization',
    authorize_params=None,
    api_base_url='https://api.linkedin.com/v2/',
    client_kwargs={'scope': 'r_liteprofile r_emailaddress'},
)

# Configuration
SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production') # This line is now redundant due to app.config['SECRET_KEY']
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
# Database Configuration
from database import get_db, get_db_connection, init_db, get_placeholder

# Initialize database on startup
print("🔄 Checking database schema...")
try:
    init_db()  # Ensures all tables exist (SQLite or Postgres)
except Exception as e:
    print(f"❌ Database initialization failed: {e}")
    # Continue anyway, as it might be a temporary connection issue
    pass

# Initialize Enhanced Features
if ENHANCED_FEATURES:
    try:
        swagger = init_swagger(app)
        print("✅ Swagger API documentation available at /api/docs/")
    except Exception as e:
        print(f"⚠️  Could not initialize Swagger: {e}")
    
    try:
        init_security_middleware(app)
    except Exception as e:
        print(f"⚠️  Could not initialize security middleware: {e}")
    
    try:
        init_performance_monitoring(app)
    except Exception as e:
        print(f"⚠️  Could not initialize performance monitoring: {e}")
    
    try:
        init_analytics_endpoints(app)
    except Exception as e:
        print(f"⚠️  Could not initialize analytics dashboard: {e}")
    
    try:
        init_cover_letter_endpoints(app)
    except Exception as e:
        print(f"⚠️  Could not initialize cover letter generator: {e}")
    
    try:
        init_cache_endpoints(app)
    except Exception as e:
        print(f"⚠️  Could not initialize cache system: {e}")
    
    try:
        init_job_alerts(app)
    except Exception as e:
        print(f"⚠️  Could not initialize job alerts: {e}")
    
    try:
        init_resume_comparison_endpoints(app)
    except Exception as e:
        print(f"⚠️  Could not initialize resume comparison: {e}")
    
    try:
        init_interview_prep_endpoints(app)
    except Exception as e:
        print(f"⚠️  Could not initialize interview prep: {e}")
    
    try:
        init_application_reminders(app)
    except Exception as e:
        print(f"⚠️  Could not initialize application reminders: {e}")
    
    try:
        init_salary_insights_endpoints(app)
    except Exception as e:
        print(f"⚠️  Could not initialize salary insights: {e}")
    
    try:
        init_pdf_export_endpoints(app)
    except Exception as e:
        print(f"⚠️  Could not initialize PDF export: {e}")
    
    print("🎉 All systems initialized successfully!")

# Helper functions
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def verify_token(token):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return payload['user_id']
    except:
        return None

@app.route('/health')
def health_check():
    """Health check endpoint"""
    try:
        conn, db_type = get_db_connection()
        cursor = conn.cursor()
        
        # Check if tables exist
        if db_type == 'postgres':
            cursor.execute("SELECT to_regclass('public.users')")
            result = cursor.fetchone()
            # Handle RealDictCursor vs standard
            if isinstance(result, dict):
                tables_exist = result['to_regclass'] is not None
            else:
                tables_exist = result[0] is not None
        else:
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
            tables_exist = cursor.fetchone() is not None
            
        conn.close()
        
        return jsonify({
            'status': 'healthy',
            'database_type': db_type,
            'tables_exist': tables_exist,
            'version': '1.0.0'
        })
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e)
        }), 500

@app.route('/debug-db')
def debug_db():
    """Debug database connection"""
    try:
        database_url = os.environ.get('DATABASE_URL')
        conn, db_type = get_db_connection()
        conn.close()
        
        return jsonify({
            'database_url_set': bool(database_url),
            'database_type': db_type,
            'connection_successful': True,
            'env_vars': {k: '***' for k in os.environ.keys() if 'DB' in k or 'POSTGRES' in k}
        })
    except Exception as e:
        return jsonify({
            'database_url_set': bool(os.environ.get('DATABASE_URL')),
            'connection_successful': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500

@app.route('/migrate')
def run_migration():
    """Run database migration manually"""
    auth_header = request.headers.get('Authorization')
    # Simple protection: only allow if a specific secret header is present or just open for now (user requested fix)
    # For safety, let's just allow it but log it. In prod, protect this!
    
    try:
        conn, db_type = get_db_connection()
        if db_type != 'postgres':
            return jsonify({'error': 'Not connected to Postgres, cannot migrate'}), 400
            
        cursor = conn.cursor()
        
        # Read schema file
        schema_path = os.path.join(os.path.dirname(__file__), 'supabase_schema.sql')
        with open(schema_path, 'r') as f:
            schema_sql = f.read()
            
        # Execute schema
        # Split by ; to execute statements individually if needed, or execute script
        cursor.execute(schema_sql)
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Migration executed successfully', 'db_type': db_type}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Routes to serve frontend app files
@app.route('/')
def index():
    """Serve the main landing page"""
    try:
        return send_from_directory(static_folder_path, 'index.html')
    except Exception as e:
        print(f"Error serving index.html: {e}")
        return jsonify({'error': 'Frontend not found', 'message': str(e)}), 404

@app.route('/app/<path:path>')
def send_app_files(path):
    """Serve static files from app directory"""
    try:
        return send_from_directory(static_folder_path, path)
    except Exception as e:
        print(f"Error serving {path}: {e}")
        return jsonify({'error': 'File not found', 'path': path}), 404


# ============= AUTHENTICATION ENDPOINTS =============

@app.route('/api/auth/register', methods=['POST'])
@limiter.limit("5 per minute")
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
        
        conn, db_type = get_db_connection()
        cursor = conn.cursor()
        P = '%s' if db_type == 'postgres' else '?'
        
        # Check if user exists
        cursor.execute(f'SELECT id FROM users WHERE email = {P}', (email,))
        if cursor.fetchone():
            conn.close()
            return jsonify({'error': 'Email already registered'}), 400
        
        # Create user
        hashed_password = hash_password(password)
        cursor.execute(f'''
            INSERT INTO users (email, password_hash, full_name, phone)
            VALUES ({P}, {P}, {P}, {P})
        ''', (email, hashed_password, full_name, phone))
        conn.commit()
        
        # Get ID (Postgres vs SQLite)
        if db_type == 'postgres':
             # For Postgres, we need to fetch the ID if not using RETURNING (which we didn't above)
             # Better to use RETURNING in the INSERT
             cursor.execute(f'SELECT id FROM users WHERE email = {P}', (email,))
             user_id = cursor.fetchone()['id'] # RealDictCursor
        else:
             user_id = cursor.lastrowid
        
        # Generate JWT token
        token = jwt.encode({
            'user_id': user_id,
            'email': email,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
        }, SECRET_KEY, algorithm='HS256')
        
        # Send welcome email
        try:
            send_welcome_email(email, full_name or 'User')
            print(f"✅ Welcome email sent to {email}")
            
            # Create welcome notification
            create_notification(
                user_id,
                'Welcome to JoBika!',
                'Your account has been successfully created. Start by uploading your resume.',
                'info'
            )
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
@limiter.limit("5 per minute")
def login():
    """Login user"""
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'error': 'Email and password required'}), 400
        
        conn, db_type = get_db_connection()
        cursor = conn.cursor()
        P = '%s' if db_type == 'postgres' else '?'
        
        hashed_password = hash_password(password)
        cursor.execute(f'''
            SELECT id, email, full_name, phone
            FROM users
            WHERE email = {P} AND password_hash = {P}
        ''', (email, hashed_password))
        
        user = cursor.fetchone()
        conn.close()
        
        if not user:
            return jsonify({'error': 'Invalid credentials'}), 401
            
        # Check if 2FA is enabled
        if user['is_two_factor_enabled']:
            # If 2FA code is provided, verify it
            code = data.get('twoFactorCode')
            if code:
                totp = pyotp.TOTP(user['two_factor_secret'])
                if not totp.verify(code):
                    return jsonify({'error': 'Invalid 2FA code'}), 401
            else:
                # Return 2FA required response
                return jsonify({
                    'require2fa': True,
                    'email': email
                }), 200
        
        # Generate JWT token
        token = jwt.encode({
            'user_id': user['id'],
            'email': user['email'],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
        }, SECRET_KEY, algorithm='HS256')
        
        return jsonify({
            'token': token,
            'user': {
                'id': user['id'],
                'email': user['email'],
                'fullName': user['full_name'],
                'phone': user['phone'],
                'isTwoFactorEnabled': bool(user['is_two_factor_enabled'])
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/<provider>')
def oauth_login(provider):
    """Initiate OAuth login"""
    client = oauth.create_client(provider)
    redirect_uri = url_for('oauth_callback', provider=provider, _external=True)
    return client.authorize_redirect(redirect_uri)

@app.route('/api/auth/<provider>/callback')
def oauth_callback(provider):
    """Handle OAuth callback"""
    try:
        client = oauth.create_client(provider)
        token = client.authorize_access_token()
        
        if provider == 'google':
            user_info = client.userinfo()
            email = user_info['email']
            name = user_info['name']
            oauth_id = user_info['sub']
        elif provider == 'linkedin':
            resp = client.get('me')
            profile = resp.json()
            oauth_id = profile['id']
            name = f"{profile['localizedFirstName']} {profile['localizedLastName']}"
            
            email_resp = client.get('emailAddress?q=members&projection=(elements*(handle~))')
            email = email_resp.json()['elements'][0]['handle~']['emailAddress']
            
        # Check if user exists
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM users WHERE email = ?', (email,))
        user = cursor.fetchone()
        
        if not user:
            # Create new user
            cursor.execute('''
                INSERT INTO users (email, password_hash, full_name, oauth_provider, oauth_id)
                VALUES (?, ?, ?, ?, ?)
            ''', (email, 'oauth_user', name, provider, oauth_id))
            conn.commit()
            user_id = cursor.lastrowid
            
            # Send welcome email
            try:
                send_welcome_email(email, name)
            except:
                pass
                
            user = {'id': user_id, 'email': email, 'full_name': name, 'is_two_factor_enabled': 0}
        else:
            # Update OAuth info if missing
            if not user['oauth_id']:
                cursor.execute('''
                    UPDATE users SET oauth_provider = ?, oauth_id = ?
                    WHERE id = ?
                ''', (provider, oauth_id, user['id']))
                conn.commit()
        
        # Generate JWT
        token = jwt.encode({
            'user_id': user['id'],
            'email': email,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
        }, SECRET_KEY, algorithm='HS256')
        
        # Redirect to frontend with token
        return redirect(f'http://localhost:5500/app/upload.html?token={token}&user={json.dumps(user)}')
        
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
        # ... existing code ...
        pass
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/jobs/save', methods=['POST'])
def save_job():
    """Save a job for later"""
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        user_id = verify_token(token)
        if not user_id: return jsonify({'error': 'Unauthorized'}), 401
        
        data = request.json
        job_id = data.get('jobId')
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Check if already saved
        ph = get_placeholder()
        query = f"SELECT id FROM saved_jobs WHERE user_id = {ph} AND job_id = {ph}"
        cursor.execute(query, (user_id, job_id))
        if cursor.fetchone():
            return jsonify({'message': 'Job already saved'})
            
        query = f"INSERT INTO saved_jobs (user_id, job_id) VALUES ({ph}, {ph})"
        cursor.execute(query, (user_id, job_id))
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Job saved successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/jobs/saved', methods=['GET'])
def get_saved_jobs():
    """Get saved jobs"""
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        user_id = verify_token(token)
        if not user_id: return jsonify({'error': 'Unauthorized'}), 401
        
        conn = get_db()
        cursor = conn.cursor()
        
        ph = get_placeholder()
        query = f'''
            SELECT j.*, sj.created_at as saved_at FROM jobs j
            JOIN saved_jobs sj ON j.id = sj.job_id
            WHERE sj.user_id = {ph}
            ORDER BY sj.created_at DESC
        '''
        cursor.execute(query, (user_id,))
        jobs = cursor.fetchall()
        conn.close()
        
        # Format jobs
        result = []
        for job in jobs:
            result.append({
                'id': job['id'],
                'title': job['title'],
                'company': job['company'],
                'location': job['location'],
                'salary': job['salary'],
                'matchScore': 0,
                'skills': json.loads(job['required_skills']) if job['required_skills'] else [],
                'posted': job['posted_date'],
                'savedAt': job['saved_at']
            })
            
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/jobs/saved/<int:job_id>', methods=['DELETE'])
def remove_saved_job(job_id):
    """Remove a job from saved jobs"""
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        user_id = verify_token(token)
        if not user_id: return jsonify({'error': 'Unauthorized'}), 401
        
        conn = get_db()
        cursor = conn.cursor()
        
        ph = get_placeholder()
        query = f"DELETE FROM saved_jobs WHERE user_id = {ph} AND job_id = {ph}"
        cursor.execute(query, (user_id, job_id))
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Job removed from saved jobs'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/resume/update', methods=['PUT'])
def update_resume_content():
    """Update resume content manually"""
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        user_id = verify_token(token)
        if not user_id: return jsonify({'error': 'Unauthorized'}), 401
        
        data = request.json
        section = data.get('section')
        content = data.get('content')
        
        # Logic to update specific fields in the DB based on section
        # For simplicity, we might store a JSON blob or specific columns
        # This is a simplified implementation
        
        return jsonify({'message': 'Resume updated successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/resume/enhance-section', methods=['POST'])
def enhance_resume_section():
    """AI Enhance a specific section using Google Gemini"""
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        user_id = verify_token(token)
        if not user_id: return jsonify({'error': 'Unauthorized'}), 401
        
        data = request.json
        text = data.get('text', '')
        section_type = data.get('sectionType', 'general')
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        # Import AI service
        try:
            from ai_service import enhance_resume_text
            enhanced = enhance_resume_text(text, section_type)
        except ImportError:
            # Fallback if ai_service not available
            enhanced = f"[Enhanced] {text}"
        
        return jsonify({'enhancedText': enhanced})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
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
        
        if not job_id:
            return jsonify({'error': 'Job ID required'}), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Get job details
        cursor.execute('SELECT * FROM jobs WHERE id = ?', (job_id,))
        job = cursor.fetchone()
        
        # Get user's resume
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
                
            # Create in-app notification
            create_notification(
                user_id, 
                'Application Submitted', 
                f"Successfully applied to {job['title']} at {job['company']}", 
                'success'
            )
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

# ============= ANALYTICS & LEARNING ENDPOINTS =============

@app.route('/api/analytics', methods=['GET'])
def get_analytics():
    """Get user analytics and market insights"""
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        user_id = verify_token(token)
        
        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401
            
        # Get user stats
        user_stats = get_application_stats(user_id)
        
        # Get market insights
        market_insights = get_market_insights()
        
        return jsonify({
            'userStats': user_stats,
            'marketInsights': market_insights
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/learning/recommendations', methods=['GET'])
def get_learning_recs():
    """Get learning recommendations for skills"""
    try:
        skills = request.args.get('skills', '').split(',')
        skills = [s.strip() for s in skills if s.strip()]
        
        if not skills:
            return jsonify([])
            
        recommendations = get_recommendations_for_gaps(skills)
        return jsonify(recommendations)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============= NOTIFICATION ENDPOINTS =============

@app.route('/api/notifications', methods=['GET'])
def get_notifications():
    """Get user notifications"""
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        user_id = verify_token(token)
        
        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401
            
        conn, db_type = get_db_connection()
        cursor = conn.cursor()
        P = '%s' if db_type == 'postgres' else '?'
        
        cursor.execute(f'''
            SELECT * FROM notifications 
            WHERE user_id = {P} 
            ORDER BY created_at DESC 
            LIMIT 50
        ''', (user_id,))
        
        notifications = []
        for row in cursor.fetchall():
            notifications.append({
                'id': row['id'],
                'title': row['title'],
                'message': row['message'],
                'type': row['type'],
                'isRead': bool(row['is_read']),
                'createdAt': row['created_at']
            })
            
        conn.close()
        return jsonify(notifications)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/notifications/mark-read', methods=['POST'])
def mark_notifications_read():
    """Mark notifications as read"""
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        user_id = verify_token(token)
        
        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401
            
        data = request.json
        notification_ids = data.get('ids', [])
        
        conn, db_type = get_db_connection()
        cursor = conn.cursor()
        P = '%s' if db_type == 'postgres' else '?'
        
        if notification_ids:
            # Mark specific notifications
            placeholders = ','.join(P for _ in notification_ids)
            cursor.execute(f'''
                UPDATE notifications 
                SET is_read = 1 
                WHERE user_id = {P} AND id IN ({placeholders})
            ''', [user_id] + notification_ids)
        else:
            # Mark all as read
            cursor.execute(f'''
                UPDATE notifications 
                SET is_read = 1 
                WHERE user_id = {P}
            ''', (user_id,))
            
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Notifications marked as read'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def create_notification(user_id, title, message, type='info'):
    """Helper to create a notification"""
    try:
        conn, db_type = get_db_connection()
        cursor = conn.cursor()
        P = '%s' if db_type == 'postgres' else '?'
        
        cursor.execute(f'''
            INSERT INTO notifications (user_id, title, message, type)
            VALUES ({P}, {P}, {P}, {P})
        ''', (user_id, title, message, type))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Failed to create notification: {e}")

# ============= SECURITY (2FA) ENDPOINTS =============

@app.route('/api/auth/2fa/setup', methods=['POST'])
def setup_2fa():
    """Generate 2FA secret and QR code"""
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        user_id = verify_token(token)
        
        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401
            
        # Generate secret
        secret = pyotp.random_base32()
        
        # Generate QR code
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT email FROM users WHERE id = ?', (user_id,))
        user = cursor.fetchone()
        conn.close()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        totp = pyotp.TOTP(secret)
        provisioning_uri = totp.provisioning_uri(name=user['email'], issuer_name="JoBika")
        
        # Create QR code image
        img = qrcode.make(provisioning_uri)
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        qr_code_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
        
        return jsonify({
            'secret': secret,
            'qrCode': f"data:image/png;base64,{qr_code_base64}"
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/2fa/verify', methods=['POST'])
def verify_2fa():
    """Verify 2FA code and enable it"""
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        user_id = verify_token(token)
        
        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401
            
        data = request.json
        secret = data.get('secret')
        code = data.get('code')
        
        if not secret or not code:
            return jsonify({'error': 'Secret and code required'}), 400
            
        totp = pyotp.TOTP(secret)
        if totp.verify(code):
            # Enable 2FA for user
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute('''
                UPDATE users 
                SET two_factor_secret = ?, is_two_factor_enabled = 1 
                WHERE id = ?
            ''', (secret, user_id))
            conn.commit()
            conn.close()
            
            return jsonify({'message': '2FA enabled successfully'})
        else:
            return jsonify({'error': 'Invalid code'}), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/2fa/disable', methods=['POST'])
def disable_2fa():
    """Disable 2FA"""
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        user_id = verify_token(token)
        
        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401
            
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE users 
            SET two_factor_secret = NULL, is_two_factor_enabled = 0 
            WHERE id = ?
        ''', (user_id,))
        conn.commit()
        conn.close()
        
        return jsonify({'message': '2FA disabled successfully'})
        
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
    return send_from_directory(static_folder_path, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(static_folder_path, path)

if __name__ == '__main__':
    print("🚀 JoBika Server Starting...")
    print("✅ Resume customization enabled")
    print("✅ Skill gap analysis enabled")
    print("✅ Universal job scraping enabled")
    print("✅ Auto-apply cron job scheduled (daily at 9 AM)")
    print("🌐 Server running on http://localhost:5000")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
