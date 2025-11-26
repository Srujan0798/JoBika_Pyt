"""
JoBika - AI Models Module
Advanced AI integration using Hugging Face Transformers
"""

from transformers import pipeline, AutoTokenizer, AutoModel
import torch
from sentence_transformers import SentenceTransformer
import numpy as np

class ResumeAnalyzer:
    """
    Analyzes resumes using BERT to extract skills and experience
    """
    def __init__(self):
        self.model_name = "bert-base-uncased"
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
        self.model = AutoModel.from_pretrained(self.model_name)
        self.ner_pipeline = pipeline("ner", model="dslim/bert-base-NER")
        
    def extract_skills(self, resume_text):
        """Extract skills from resume text"""
        # Use NER to identify entities
        entities = self.ner_pipeline(resume_text)
        
        # Filter for skills (you can customize this)
        skills = []
        for entity in entities:
            if entity['entity'].startswith('B-') or entity['entity'].startswith('I-'):
                skills.append(entity['word'])
        
        return list(set(skills))
    
    def analyze_experience(self, resume_text):
        """Analyze years of experience and seniority"""
        # Simple implementation - can be enhanced
        years_keywords = ['years', 'year', 'yrs', 'yr']
        sentences = resume_text.split('.')
        
        experience_years = 0
        for sentence in sentences:
            for keyword in years_keywords:
                if keyword in sentence.lower():
                    # Extract number before keyword
                    words = sentence.split()
                    for i, word in enumerate(words):
                        if keyword in word.lower() and i > 0:
                            try:
                                years = int(words[i-1])
                                experience_years = max(experience_years, years)
                            except:
                                pass
        
        return {
            'years': experience_years,
            'level': 'Senior' if experience_years >= 5 else 'Mid-level' if experience_years >= 2 else 'Junior'
        }


class CoverLetterGenerator:
    """
    Generates personalized cover letters using GPT-2
    """
    def __init__(self):
        self.generator = pipeline('text-generation', model='gpt2')
    
    def generate(self, resume_summary, job_description, company_name):
        """Generate a personalized cover letter"""
        prompt = f"""Write a professional cover letter for a job application.

Resume Summary: {resume_summary}

Job Description: {job_description}

Company: {company_name}

Cover Letter:
Dear Hiring Manager,

I am writing to express my strong interest in"""
        
        result = self.generator(
            prompt,
            max_length=500,
            num_return_sequences=1,
            temperature=0.7,
            do_sample=True
        )
        
        cover_letter = result[0]['generated_text']
        
        # Clean up and format
        cover_letter = cover_letter.replace(prompt, '').strip()
        
        return cover_letter


class JobMatcher:
    """
    Semantic job-resume matching using Sentence Transformers
    """
    def __init__(self):
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
    
    def calculate_match(self, resume_text, job_description):
        """Calculate semantic similarity between resume and job"""
        # Generate embeddings
        resume_embedding = self.model.encode(resume_text)
        job_embedding = self.model.encode(job_description)
        
        # Calculate cosine similarity
        similarity = np.dot(resume_embedding, job_embedding) / (
            np.linalg.norm(resume_embedding) * np.linalg.norm(job_embedding)
        )
        
        # Convert to percentage
        match_score = int(similarity * 100)
        
        return {
            'score': match_score,
            'level': 'Excellent' if match_score >= 80 else 'Good' if match_score >= 60 else 'Fair' if match_score >= 40 else 'Poor'
        }
    
    def find_matching_jobs(self, resume_text, jobs, top_k=10):
        """Find top matching jobs for a resume"""
        matches = []
        
        for job in jobs:
            job_desc = f"{job['title']} {job['description']} {' '.join(job.get('skills', []))}"
            match = self.calculate_match(resume_text, job_desc)
            
            matches.append({
                'job_id': job['id'],
                'job_title': job['title'],
                'company': job['company'],
                'match_score': match['score'],
                'match_level': match['level']
            })
        
        # Sort by match score
        matches.sort(key=lambda x: x['match_score'], reverse=True)
        
        return matches[:top_k]


# Example usage
if __name__ == "__main__":
    # Test Resume Analyzer
    analyzer = ResumeAnalyzer()
    sample_resume = "Software Engineer with 5 years of experience in Python, JavaScript, and React."
    
    skills = analyzer.extract_skills(sample_resume)
    experience = analyzer.analyze_experience(sample_resume)
    
    print("Skills:", skills)
    print("Experience:", experience)
    
    # Test Job Matcher
    matcher = JobMatcher()
    sample_job = "Looking for a Senior Python Developer with React experience"
    
    match = matcher.calculate_match(sample_resume, sample_job)
    print("Match Score:", match)
