"""
Cover Letter Generator for JoBika
AI-powered cover letter generation based on job description and user resume
"""

import re
from datetime import datetime

class CoverLetterGenerator:
    """Generate personalized cover letters"""
    
    def __init__(self):
        self.templates = {
            'professional': self._professional_template,
            'creative': self._creative_template,
            'technical': self._technical_template
        }
    
    def generate(self, user_data, job_data, style='professional'):
        """
        Generate cover letter
        
        Args:
            user_data: dict with name, skills, experience
            job_data: dict with title, company, description, required_skills
            style: template style (professional, creative, technical)
        
        Returns:
            dict with cover_letter text and metadata
        """
        template_func = self.templates.get(style, self._professional_template)
        cover_letter = template_func(user_data, job_data)
        
        return {
            'cover_letter': cover_letter,
            'style': style,
            'generated_at': datetime.now().isoformat(),
            'word_count': len(cover_letter.split()),
            'company': job_data.get('company'),
            'position': job_data.get('title')
        }
    
    def _professional_template(self, user_data, job_data):
        """Professional cover letter template"""
        name = user_data.get('name', 'Applicant')
        company = job_data.get('company', 'the company')
        position = job_data.get('title', 'this position')
        
        # Extract key skills that match
        user_skills = set(s.lower() for s in user_data.get('skills', []))
        job_skills = set(s.lower() for s in job_data.get('required_skills', []))
        matching_skills = list(user_skills & job_skills)[:3]
        
        skills_text = ', '.join(matching_skills) if matching_skills else 'relevant skills'
        
        letter = f"""Dear Hiring Manager,

I am writing to express my strong interest in the {position} position at {company}. With my background in {skills_text}, I am excited about the opportunity to contribute to your team.

Throughout my career, I have developed expertise in {', '.join(matching_skills[:2]) if len(matching_skills) >= 2 else 'various technologies'}. My experience aligns well with the requirements outlined in the job description, and I am particularly drawn to {company}'s commitment to innovation and excellence.

I am confident that my skills in {skills_text} would make me a valuable addition to your team. I am eager to bring my technical expertise and passion for problem-solving to {company}.

Thank you for considering my application. I look forward to the opportunity to discuss how I can contribute to your team's success.

Sincerely,
{name}
"""
        return letter
    
    def _creative_template(self, user_data, job_data):
        """Creative cover letter template"""
        name = user_data.get('name', 'Applicant')
        company = job_data.get('company', 'your company')
        position = job_data.get('title', 'this exciting role')
        
        letter = f"""Hello {company} Team!

I couldn't contain my excitement when I saw the {position} opening at {company}. This feels like the perfect opportunity where my passion meets purpose.

Here's what I bring to the table:
💡 Creative problem-solving with a technical edge
🚀 Experience in innovative project delivery
🤝 Collaborative mindset with excellent communication skills

What excites me most about {company} is your innovative approach and commitment to excellence. I've been following your work, and I'm inspired by your impact in the industry.

I'd love the chance to discuss how my unique blend of skills and enthusiasm can contribute to your team's continued success.

Looking forward to connecting!

Best regards,
{name}
"""
        return letter
    
    def _technical_template(self, user_data, job_data):
        """Technical cover letter template"""
        name = user_data.get('name', 'Applicant')
        company = job_data.get('company', 'your organization')
        position = job_data.get('title', 'this technical position')
        experience_years = user_data.get('experience_years', 0)
        
        user_skills = set(s.lower() for s in user_data.get('skills', []))
        job_skills = set(s.lower() for s in job_data.get('required_skills', []))
        matching_skills = list(user_skills & job_skills)
        
        technical_skills = ', '.join(matching_skills) if matching_skills else 'relevant technologies'
        
        letter = f"""Dear Technical Hiring Manager,

I am applying for the {position} role at {company}. With {experience_years} years of experience in software development, I have developed strong expertise in {technical_skills}.

Technical Qualifications:
• Proficient in: {technical_skills}
• Experience with modern development practices and methodologies
• Strong problem-solving and analytical skills
• Proven track record of delivering high-quality technical solutions

I am particularly interested in {company}'s technical stack and the challenges outlined in the job description. My experience aligns well with your requirements, and I am excited about the opportunity to contribute to your engineering team.

I would welcome the opportunity to discuss how my technical background and skills can benefit your team.

Technical regards,
{name}
"""
        return letter
    
    def customize_for_keywords(self, cover_letter, keywords):
        """Add specific keywords to cover letter"""
        # This is a simple implementation - could be enhanced with NLP
        keyword_snippet = f"\n\nKey areas of expertise: {', '.join(keywords[:5])}"
        return cover_letter + keyword_snippet

# Global instance
cover_letter_generator = CoverLetterGenerator()

def init_cover_letter_endpoints(app):
    """Initialize cover letter endpoints"""
    from flask import request, jsonify
    
    @app.route('/api/cover-letter/generate', methods=['POST'])
    def generate_cover_letter():
        """Generate cover letter"""
        from server import verify_token, get_db
        
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        user_id = verify_token(token)
        
        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401
        
        data = request.json
        job_id = data.get('jobId')
        style = data.get('style', 'professional')
        
        if not job_id:
            return jsonify({'error': 'Job ID required'}), 400
        
        # Get user resume data
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
            return jsonify({'error': 'No resume found. Please upload a resume first.'}), 404
        
        # Get job data
        cursor.execute('SELECT * FROM jobs WHERE id = ?', (job_id,))
        job = cursor.fetchone()
        
        if not job:
            conn.close()
            return jsonify({'error': 'Job not found'}), 404
        
        # Get user info
        cursor.execute('SELECT full_name FROM users WHERE id = ?', (user_id,))
        user = cursor.fetchone()
        
        conn.close()
        
        # Prepare data for generation
        import json
        user_data = {
            'name': user['full_name'] if user else 'Applicant',
            'skills': json.loads(resume['skills']) if resume['skills'] else [],
            'experience_years': resume['experience_years'] or 0
        }
        
        job_data = {
            'title': job['title'],
            'company': job['company'],
            'description': job['description'],
            'required_skills': json.loads(job['required_skills']) if job['required_skills'] else []
        }
        
        # Generate cover letter
        result = cover_letter_generator.generate(user_data, job_data, style)
        
        return jsonify(result)
    
    @app.route('/api/cover-letter/styles')
    def get_cover_letter_styles():
        """Get available cover letter styles"""
        return jsonify({
            'styles': [
                {
                    'id': 'professional',
                    'name': 'Professional',
                    'description': 'Formal and traditional business style'
                },
                {
                    'id': 'creative',
                    'name': 'Creative',
                    'description': 'Engaging and personality-driven'
                },
                {
                    'id': 'technical',
                    'name': 'Technical',
                    'description': 'Focused on technical skills and experience'
                }
            ]
        })
    
    print("✅ Cover letter endpoints initialized")

# Add to server.py initialization
