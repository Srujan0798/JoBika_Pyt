"""
Interview Preparation Tips for JoBika
AI-powered interview tips based on job and resume
"""

import json
import random

class InterviewPrepSystem:
    """Generate interview preparation tips"""
    
    def __init__(self):
        self.question_templates = {
            'technical': [
                "Explain your experience with {skill}",
                "How would you approach a problem involving {skill}?",
                "What is your proficiency level with {skill}?",
                "Can you walk me through a project where you used {skill}?",
                "What are the pros and cons of {skill} compared to alternatives?"
            ],
            'behavioral': [
                "Tell me about a time when you faced a challenging project",
                "How do you handle tight deadlines?",
                "Describe a situation where you had to work with a difficult team member",
                "What is your greatest professional achievement?",
                "How do you stay updated with industry trends?",
                "Describe a failure and what you learned from it"
            ],
            'company': [
                "Why do you want to work at {company}?",
                "What do you know about {company}'s products/services?",
                "How do you align with {company}'s values?",
                "Where do you see yourself in 5 years at {company}?"
            ],
            'role_specific': [
                "Why are you interested in the {role} position?",
                "What makes you a good fit for {role}?",
                "What challenges do you anticipate in this {role}?",
                "How would you contribute to our team as a {role}?"
            ]
        }
        
        self.tips = {
            'preparation': [
                "Research the company thoroughly before the interview",
                "Practice your answers using the STAR method (Situation, Task, Action, Result)",
                "Prepare questions to ask the interviewer",
                "Review your resume and be ready to discuss each point",
                "Test your tech setup if it's a virtual interview"
            ],
            'during': [
                "Arrive 10-15 minutes early (or join virtual meeting early)",
                "Make eye contact and show enthusiasm",
                "Listen carefully to questions before answering",
                "Use specific examples from your experience",
                "It's okay to ask for clarification if you don't understand a question"
            ],
            'after': [
                "Send a thank-you email within 24 hours",
                "Reflect on questions you found challenging",
                "Follow up on any action items mentioned",
                "Stay patient while waiting for a response",
                "Keep applying to other positions meanwhile"
            ]
        }
    
    def generate_prep_guide(self, job_data, user_skills):
        """
        Generate comprehensive interview prep guide
        
        Args:
            job_data: dict with title, company, description, required_skills
            user_skills: list of user's skills
        
        Returns:
            dict with questions, tips, and resources
        """
        job_title = job_data.get('title', 'this position')
        company = job_data.get('company', 'the company')
        required_skills = job_data.get('required_skills', [])
        
        # Match skills
        user_skills_lower = [s.lower() for s in user_skills]
        required_skills_lower = [s.lower() for s in required_skills]
        matching_skills = list(set(user_skills_lower) & set(required_skills_lower))
        missing_skills = list(set(required_skills_lower) - set(user_skills_lower))
        
        # Generate questions
        questions = self._generate_questions(
            job_title, company, matching_skills, missing_skills
        )
        
        # Select tips
        tips = {
            'preparation': random.sample(self.tips['preparation'], min(3, len(self.tips['preparation']))),
            'during': random.sample(self.tips['during'], min(3, len(self.tips['during']))),
            'after': random.sample(self.tips['after'], min(3, len(self.tips['after'])))
        }
        
        # Areas to focus
        focus_areas = []
        if matching_skills:
            focus_areas.append({
                'area': 'Technical Skills',
                'description': f"Be ready to discuss your experience with: {', '.join(matching_skills[:5])}"
            })
        
        if missing_skills:
            focus_areas.append({
                'area': 'Skill Gaps',
                'description': f"Explain how you'd learn: {', '.join(missing_skills[:3])}"
            })
        
        focus_areas.append({
            'area': 'Company Knowledge',
            'description': f"Research {company}'s recent news, products, and culture"
        })
        
        return {
            'job_info': {
                'title': job_title,
                'company': company
            },
            'likely_questions': questions,
            'preparation_tips': tips,
            'focus_areas': focus_areas,
            'skill_match': {
                'matching': matching_skills,
                'to_learn': missing_skills[:5]
            }
        }
    
    def _generate_questions(self, job_title, company, matching_skills, missing_skills):
        """Generate likely interview questions"""
        questions = []
        
        # Technical questions based on matching skills
        for skill in matching_skills[:5]:
            template = random.choice(self.question_templates['technical'])
            questions.append({
                'type': 'technical',
                'question': template.format(skill=skill.title()),
                'tip': f"Prepare a specific example of using {skill.title()} in a project"
            })
        
        # Questions about missing skills
        for skill in missing_skills[:2]:
            questions.append({
                'type': 'technical',
                'question': f"Are you familiar with {skill.title()}? How would you learn it?",
                'tip': "Be honest but show enthusiasm for learning"
            })
        
        # Behavioral questions
        for question in random.sample(self.question_templates['behavioral'], 3):
            questions.append({
                'type': 'behavioral',
                'question': question,
                'tip': "Use the STAR method (Situation, Task, Action, Result)"
            })
        
        # Company-specific questions
        for template in random.sample(self.question_templates['company'], 2):
            questions.append({
                'type': 'company',
                'question': template.format(company=company),
                'tip': f"Research {company}'s mission, values, and recent news"
            })
        
        # Role-specific questions
        for template in random.sample(self.question_templates['role_specific'], 2):
            questions.append({
                'type': 'role',
                'question': template.format(role=job_title),
                'tip': "Connect your experience to the job requirements"
            })
        
        return questions

# Global instance
interview_prep = InterviewPrepSystem()

def init_interview_prep_endpoints(app):
    """Initialize interview prep endpoints"""
    from flask import request, jsonify
    
    @app.route('/api/interview/prep', methods=['POST'])
    def get_interview_prep():
        """Get interview preparation guide"""
        from server import verify_token, get_db
        
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        user_id = verify_token(token)
        
        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401
        
        data = request.json
        job_id = data.get('jobId')
        
        if not job_id:
            return jsonify({'error': 'Job ID required'}), 400
        
        # Get job data
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM jobs WHERE id = ?', (job_id,))
        job = cursor.fetchone()
        
        if not job:
            conn.close()
            return jsonify({'error': 'Job not found'}), 404
        
        # Get user's latest resume
        cursor.execute('''
            SELECT skills FROM resumes
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT 1
        ''', (user_id,))
        resume = cursor.fetchone()
        
        conn.close()
        
        user_skills = json.loads(resume['skills']) if resume and resume['skills'] else []
        
        job_data = {
            'title': job['title'],
            'company': job['company'],
            'description': job['description'],
            'required_skills': json.loads(job['required_skills']) if job['required_skills'] else []
        }
        
        # Generate prep guide
        prep_guide = interview_prep.generate_prep_guide(job_data, user_skills)
        
        return jsonify(prep_guide)
    
    print("✅ Interview prep endpoints initialized")
