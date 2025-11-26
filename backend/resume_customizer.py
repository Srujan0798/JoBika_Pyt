# JoBika - AI Resume Customization Engine
# Automatically customize resumes for each job application

import re
from typing import Dict, List, Set
import json

class ResumeCustomizer:
    """
    Customize resume for specific job descriptions
    """
    
    def __init__(self):
        self.skill_keywords = self._load_skill_keywords()
    
    def _load_skill_keywords(self) -> Dict[str, List[str]]:
        """Load skill keywords for different domains"""
        return {
            'full_stack': ['react', 'node.js', 'javascript', 'typescript', 'mongodb', 'express', 'vue', 'angular'],
            'backend': ['python', 'java', 'spring boot', 'django', 'flask', 'microservices', 'rest api', 'graphql'],
            'frontend': ['react', 'vue', 'angular', 'html', 'css', 'javascript', 'typescript', 'tailwind'],
            'ai_ml': ['python', 'tensorflow', 'pytorch', 'machine learning', 'deep learning', 'nlp', 'computer vision'],
            'data': ['python', 'sql', 'pandas', 'numpy', 'data analysis', 'tableau', 'power bi', 'spark'],
            'devops': ['docker', 'kubernetes', 'aws', 'azure', 'ci/cd', 'jenkins', 'terraform', 'ansible'],
            'mobile': ['react native', 'flutter', 'android', 'ios', 'swift', 'kotlin', 'java']
        }
    
    def customize_resume_for_job(self, base_resume: Dict, job_description: str, job_title: str) -> Dict:
        """
        Create customized resume version for specific job
        
        Args:
            base_resume: User's base resume data
            job_description: Job description text
            job_title: Job title
            
        Returns:
            Customized resume with highlighted relevant skills and experience
        """
        # Extract job requirements
        job_skills = self._extract_skills_from_text(job_description)
        job_keywords = self._extract_keywords(job_description)
        job_domain = self._classify_job_domain(job_title, job_description)
        
        # Get user's skills
        user_skills = base_resume.get('skills', [])
        
        # Calculate matching
        matching_skills = set([s.lower() for s in user_skills]) & set([s.lower() for s in job_skills])
        missing_skills = set([s.lower() for s in job_skills]) - set([s.lower() for s in user_skills])
        
        # Calculate match score
        match_score = self._calculate_match_score(matching_skills, job_skills)
        
        # Customize sections
        customized_resume = {
            'summary': self._generate_targeted_summary(base_resume, job_domain, job_title),
            'skills': self._prioritize_skills(user_skills, job_skills),
            'projects': self._highlight_relevant_projects(base_resume.get('projects', []), job_domain, job_keywords),
            'experience': self._emphasize_relevant_experience(base_resume.get('experience', []), job_keywords, job_domain),
            'education': base_resume.get('education', []),
            'achievements': base_resume.get('achievements', []),
            'match_score': match_score,
            'matching_skills': list(matching_skills),
            'missing_skills': list(missing_skills),
            'job_domain': job_domain
        }
        
        return customized_resume
    
    def _extract_skills_from_text(self, text: str) -> List[str]:
        """Extract technical skills from text"""
        text_lower = text.lower()
        found_skills = []
        
        # Common technical skills
        all_skills = [
            'Python', 'Java', 'JavaScript', 'TypeScript', 'C++', 'C#', 'Go', 'Rust', 'PHP', 'Ruby',
            'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask', 'Spring Boot',
            'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch',
            'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'Git', 'CI/CD',
            'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'NLP', 'Computer Vision',
            'REST API', 'GraphQL', 'Microservices', 'SQL', 'NoSQL',
            'HTML', 'CSS', 'Tailwind', 'Bootstrap', 'SASS',
            'React Native', 'Flutter', 'Android', 'iOS', 'Swift', 'Kotlin',
            'Data Analysis', 'Pandas', 'NumPy', 'Tableau', 'Power BI', 'Excel',
            'Agile', 'Scrum', 'JIRA', 'Git', 'GitHub', 'GitLab'
        ]
        
        for skill in all_skills:
            if skill.lower() in text_lower:
                found_skills.append(skill)
        
        return found_skills
    
    def _extract_keywords(self, text: str) -> List[str]:
        """Extract important keywords from job description"""
        # Remove common words
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'}
        
        words = re.findall(r'\b[a-z]{4,}\b', text.lower())
        keywords = [w for w in words if w not in stop_words]
        
        # Get most frequent keywords
        from collections import Counter
        keyword_counts = Counter(keywords)
        top_keywords = [k for k, v in keyword_counts.most_common(20)]
        
        return top_keywords
    
    def _classify_job_domain(self, job_title: str, job_description: str) -> str:
        """Classify job into domain category"""
        text = (job_title + ' ' + job_description).lower()
        
        domain_scores = {}
        for domain, keywords in self.skill_keywords.items():
            score = sum(1 for keyword in keywords if keyword in text)
            domain_scores[domain] = score
        
        # Get domain with highest score
        if domain_scores:
            return max(domain_scores, key=domain_scores.get)
        return 'general'
    
    def _calculate_match_score(self, matching_skills: Set, job_skills: List) -> int:
        """Calculate honest match percentage"""
        if not job_skills:
            return 50
        
        score = int((len(matching_skills) / len(job_skills)) * 100)
        return min(max(score, 0), 100)
    
    def _generate_targeted_summary(self, base_resume: Dict, job_domain: str, job_title: str) -> str:
        """Generate job-specific summary"""
        name = base_resume.get('name', 'Professional')
        experience_years = base_resume.get('experience_years', 0)
        
        domain_descriptions = {
            'full_stack': 'Full-Stack Developer',
            'backend': 'Backend Engineer',
            'frontend': 'Frontend Developer',
            'ai_ml': 'AI/ML Engineer',
            'data': 'Data Analyst',
            'devops': 'DevOps Engineer',
            'mobile': 'Mobile Developer',
            'general': 'Software Developer'
        }
        
        role = domain_descriptions.get(job_domain, 'Software Developer')
        
        if experience_years > 0:
            summary = f"{role} with {experience_years}+ years of experience in building scalable applications. "
        else:
            summary = f"Motivated {role} with strong foundation in software development. "
        
        summary += f"Seeking {job_title} position to leverage technical skills and contribute to innovative projects."
        
        return summary
    
    def _prioritize_skills(self, user_skills: List[str], job_skills: List[str]) -> List[str]:
        """Prioritize skills that match job requirements"""
        job_skills_lower = [s.lower() for s in job_skills]
        
        # Matching skills first
        matching = [s for s in user_skills if s.lower() in job_skills_lower]
        # Then other skills
        other = [s for s in user_skills if s.lower() not in job_skills_lower]
        
        return matching + other
    
    def _highlight_relevant_projects(self, projects: List[Dict], job_domain: str, job_keywords: List[str]) -> List[Dict]:
        """Highlight projects relevant to job"""
        if not projects:
            return []
        
        # Score each project by relevance
        scored_projects = []
        for project in projects:
            project_text = (project.get('name', '') + ' ' + project.get('description', '')).lower()
            
            # Score by domain keywords
            domain_keywords = self.skill_keywords.get(job_domain, [])
            domain_score = sum(1 for keyword in domain_keywords if keyword in project_text)
            
            # Score by job keywords
            keyword_score = sum(1 for keyword in job_keywords if keyword in project_text)
            
            total_score = domain_score + keyword_score
            scored_projects.append((total_score, project))
        
        # Sort by score (highest first)
        scored_projects.sort(reverse=True, key=lambda x: x[0])
        
        return [p for score, p in scored_projects]
    
    def _emphasize_relevant_experience(self, experience: List[Dict], job_keywords: List[str], job_domain: str) -> List[Dict]:
        """Emphasize relevant work experience"""
        if not experience:
            return []
        
        # Score each experience by relevance
        scored_experience = []
        for exp in experience:
            exp_text = (exp.get('title', '') + ' ' + exp.get('description', '')).lower()
            
            # Score by keywords
            keyword_score = sum(1 for keyword in job_keywords if keyword in exp_text)
            
            # Score by domain
            domain_keywords = self.skill_keywords.get(job_domain, [])
            domain_score = sum(1 for keyword in domain_keywords if keyword in exp_text)
            
            total_score = keyword_score + domain_score
            scored_experience.append((total_score, exp))
        
        # Sort by score
        scored_experience.sort(reverse=True, key=lambda x: x[0])
        
        return [e for score, e in scored_experience]


# Skill Gap Analyzer
class SkillGapAnalyzer:
    """
    Analyze skill gaps and provide honest recommendations
    """
    
    def analyze_skill_gap(self, user_skills: List[str], job_skills: List[str], job_title: str) -> Dict:
        """
        Analyze skill gap between user and job requirements
        
        Returns honest assessment with learning recommendations
        """
        user_skills_lower = set([s.lower() for s in user_skills])
        job_skills_lower = set([s.lower() for s in job_skills])
        
        matching_skills = user_skills_lower & job_skills_lower
        missing_skills = job_skills_lower - user_skills_lower
        
        # Calculate match score
        if job_skills_lower:
            match_score = int((len(matching_skills) / len(job_skills_lower)) * 100)
        else:
            match_score = 50
        
        # Generate recommendations for missing skills
        recommendations = []
        for skill in missing_skills:
            priority = self._determine_skill_priority(skill, job_title)
            resources = self._get_learning_resources(skill)
            
            recommendations.append({
                'skill': skill.title(),
                'priority': priority,
                'reason': self._get_skill_reason(skill, job_title),
                'resources': resources,
                'estimated_time': self._estimate_learning_time(skill)
            })
        
        # Sort by priority
        recommendations.sort(key=lambda x: {'high': 3, 'medium': 2, 'low': 1}.get(x['priority'], 0), reverse=True)
        
        return {
            'match_score': match_score,
            'matching_skills': [s.title() for s in matching_skills],
            'missing_skills': [s.title() for s in missing_skills],
            'recommendations': recommendations,
            'assessment': self._generate_assessment(match_score)
        }
    
    def _determine_skill_priority(self, skill: str, job_title: str) -> str:
        """Determine if skill is high/medium/low priority"""
        # Core programming languages and frameworks are high priority
        high_priority_skills = ['python', 'java', 'javascript', 'react', 'node.js', 'sql', 'aws', 'docker']
        
        if skill in high_priority_skills:
            return 'high'
        elif 'senior' in job_title.lower() or 'lead' in job_title.lower():
            return 'high'
        else:
            return 'medium'
    
    def _get_learning_resources(self, skill: str) -> List[str]:
        """Get free learning resources for skill"""
        resources_map = {
            'python': ['Python.org Official Tutorial', 'Automate the Boring Stuff (Free Book)', 'Python for Everybody (Coursera)'],
            'javascript': ['MDN Web Docs', 'JavaScript.info', 'freeCodeCamp JavaScript Course'],
            'react': ['React Official Docs', 'freeCodeCamp React Course', 'React Tutorial for Beginners'],
            'node.js': ['Node.js Official Docs', 'Node.js Tutorial', 'freeCodeCamp Node.js Course'],
            'sql': ['SQLBolt', 'W3Schools SQL Tutorial', 'Khan Academy SQL'],
            'aws': ['AWS Free Tier', 'AWS Training', 'freeCodeCamp AWS Course'],
            'docker': ['Docker Official Docs', 'Docker Tutorial for Beginners', 'Play with Docker'],
            'git': ['Git Official Docs', 'GitHub Learning Lab', 'Atlassian Git Tutorial']
        }
        
        return resources_map.get(skill, ['Search for online courses', 'Practice with projects', 'Read official documentation'])
    
    def _estimate_learning_time(self, skill: str) -> str:
        """Estimate time to learn skill"""
        time_estimates = {
            'python': '2-3 months',
            'javascript': '2-3 months',
            'react': '1-2 months',
            'node.js': '1-2 months',
            'sql': '2-4 weeks',
            'aws': '2-3 months',
            'docker': '2-4 weeks',
            'git': '1-2 weeks'
        }
        
        return time_estimates.get(skill, '1-2 months')
    
    def _get_skill_reason(self, skill: str, job_title: str) -> str:
        """Explain why skill is important"""
        return f"Required for {job_title} roles. Appears in most job descriptions for this position."
    
    def _generate_assessment(self, match_score: int) -> str:
        """Generate overall assessment"""
        if match_score >= 80:
            return "Excellent match! You have most of the required skills."
        elif match_score >= 60:
            return "Good match! Learning a few more skills will make you a strong candidate."
        elif match_score >= 40:
            return "Moderate match. Focus on learning the missing high-priority skills."
        else:
            return "Consider building more foundational skills before applying to this role."
