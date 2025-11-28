"""
Guest Mode Endpoints
Allows users to try the app without login.
Data is not saved to database.
"""
from flask import jsonify, request
from werkzeug.utils import secure_filename
import os
import json
from resume_parser import parse_pdf, parse_docx, extract_email, extract_phone, extract_name, extract_skills, extract_experience_years
from resume_customizer import ResumeCustomizer, SkillGapAnalyzer

# Initialize AI modules
resume_customizer = ResumeCustomizer()
skill_analyzer = SkillGapAnalyzer()

def init_guest_endpoints(app, UPLOAD_FOLDER):
    """Initialize guest mode endpoints"""
    
    @app.route('/api/guest/upload-resume', methods=['POST'])
    def guest_upload_resume():
        """
        Upload and parse resume without authentication.
        Returns parsed data but doesn't save to database.
        """
        try:
            if 'file' not in request.files:
                return jsonify({'error': 'No file provided'}), 400
            
            file = request.files['file']
            if file.filename == '':
                return jsonify({'error': 'No file selected'}), 400
            
            # Save file temporarily
            filename = secure_filename(file.filename)
            filepath = os.path.join(UPLOAD_FOLDER, f"guest_{filename}")
            file.save(filepath)
            
            # Parse file
            original_text = None
            if filename.lower().endswith('.pdf'):
                original_text = parse_pdf(filepath)
            elif filename.lower().endswith(('.docx', '.doc')):
                original_text = parse_docx(filepath)
            else:
                # Clean up temp file
                if os.path.exists(filepath):
                    os.remove(filepath)
                return jsonify({'error': 'Unsupported file format. Please upload PDF or DOCX'}), 400
            
            if not original_text:
                # Clean up temp file
                if os.path.exists(filepath):
                    os.remove(filepath)
                return jsonify({'error': 'Failed to parse resume'}), 500
            
            # Extract information
            email = extract_email(original_text)
            phone = extract_phone(original_text)
            name = extract_name(original_text)
            skills = extract_skills(original_text)
            experience_years = extract_experience_years(original_text)
            
            # Clean up temp file
            if os.path.exists(filepath):
                os.remove(filepath)
            
            return jsonify({
                'success': True,
                'resumeText': original_text,
                'skills': skills,
                'experienceYears': experience_years,
                'extractedInfo': {
                    'name': name,
                    'email': email,
                    'phone': phone
                },
                'message': 'Resume parsed successfully. Login to save permanently.'
            })
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/guest/analyze-resume', methods=['POST'])
    def guest_analyze_resume():
        """
        Analyze resume and job match without authentication.
        Returns skill gap analysis but doesn't save to database.
        """
        try:
            data = request.json
            resume_text = data.get('resumeText', '')
            job_description = data.get('jobDescription', '')
            
            if not resume_text or not job_description:
                return jsonify({'error': 'Resume text and job description are required'}), 400
            
            # Analyze skill gap
            analysis = skill_analyzer.analyze_gap(resume_text, job_description)
            
            return jsonify({
                'success': True,
                'analysis': analysis,
                'message': 'Analysis complete. Login to save and track your progress.'
            })
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/guest/customize-resume', methods=['POST'])
    def guest_customize_resume():
        """
        Generate customized resume for job without authentication.
        Returns customized text but doesn't save to database.
        """
        try:
            data = request.json
            resume_text = data.get('resumeText', '')
            job_description = data.get('jobDescription', '')
            
            if not resume_text or not job_description:
                return jsonify({'error': 'Resume text and job description are required'}), 400
            
            # Customize resume
            customized = resume_customizer.customize_for_job(resume_text, job_description)
            
            return jsonify({
                'success': True,
                'customizedResume': customized,
                'message': 'Resume customized! Login to save this version.'
            })
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
            return jsonify({
                'success': True,
                'customizedResume': customized,
                'message': 'Resume customized! Login to save this version.'
            })
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
            
    @app.route('/api/guest/enhance-section', methods=['POST'])
    def guest_enhance_section():
        """
        Enhance resume section without authentication.
        """
        try:
            data = request.json
            text = data.get('text', '')
            section_type = data.get('sectionType', 'summary')
            
            if not text:
                return jsonify({'error': 'Text is required'}), 400
            
            enhanced_text = resume_customizer.enhance_section(text, section_type)
            
            return jsonify({
                'success': True,
                'enhancedText': enhanced_text,
                'message': 'Section enhanced!'
            })
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/auth/migrate-guest-data', methods=['POST'])
    def migrate_guest_data():
        """
        Migrate guest session data to user account after login.
        Called automatically after successful login.
        """
        try:
            token = request.headers.get('Authorization', '').replace('Bearer ', '')
            from server import verify_token, get_db_connection
            user_id = verify_token(token)
            
            if not user_id:
                return jsonify({'error': 'Unauthorized'}), 401
            
            data = request.json
            guest_resume = data.get('guestResume')
            guest_jobs = data.get('guestJobs', [])
            
            conn, db_type = get_db_connection()
            cursor = conn.cursor()
            
            # Save guest resume if provided
            if guest_resume:
                resume_text = guest_resume.get('resumeText', '')
                skills = guest_resume.get('skills', [])
                experience_years = guest_resume.get('experienceYears', 0)
                
                cursor.execute('''
                    INSERT INTO resumes (user_id, filename, original_text, skills, experience_years)
                    VALUES (?, ?, ?, ?, ?)
                ''', (user_id, 'migrated_resume.txt', resume_text, json.dumps(skills), experience_years))
            
            # Save guest saved jobs if provided
            for job in guest_jobs:
                job_id = job.get('id')
                if job_id:
                    try:
                        cursor.execute('''
                            INSERT INTO saved_jobs (user_id, job_id)
                            VALUES (?, ?)
                        ''', (user_id, job_id))
                    except:
                        pass  # Skip if already exists
            
            conn.commit()
            conn.close()
            
            return jsonify({
                'success': True,
                'message': 'Guest data migrated successfully'
            })
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    return app
