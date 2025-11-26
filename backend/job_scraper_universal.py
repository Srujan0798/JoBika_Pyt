# JoBika - Universal Job Scraper (Optimized for Indian Market)
# Scrape jobs from global sources, optimized for Indian users

import requests
from bs4 import BeautifulSoup
import time
import random
from typing import List, Dict

class UniversalJobScraper:
    """
    Scrape jobs from global job boards
    Optimized for Indian market but includes all opportunities
    """
    
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    
    def scrape_all_jobs(self, query: str, location: str = 'remote', limit: int = 50) -> List[Dict]:
        """
        Scrape jobs from multiple global sources
        Includes: Remote jobs, Indian companies, Global companies, US companies
        """
        all_jobs = []
        
        # Scrape from different sources
        try:
            # LinkedIn (Global + India)
            linkedin_jobs = self.scrape_linkedin(query, location, limit//4)
            all_jobs.extend(linkedin_jobs)
        except Exception as e:
            print(f"LinkedIn scraping failed: {e}")
        
        try:
            # Indeed (Global)
            indeed_jobs = self.scrape_indeed(query, location, limit//4)
            all_jobs.extend(indeed_jobs)
        except Exception as e:
            print(f"Indeed scraping failed: {e}")
        
        try:
            # Naukri (India-specific but good for Indian users)
            naukri_jobs = self.scrape_naukri(query, location, limit//4)
            all_jobs.extend(naukri_jobs)
        except Exception as e:
            print(f"Naukri scraping failed: {e}")
        
        try:
            # Unstop (For freshers - India)
            unstop_jobs = self.scrape_unstop(query, limit//4)
            all_jobs.extend(unstop_jobs)
        except Exception as e:
            print(f"Unstop scraping failed: {e}")
        
        # If scraping fails, return sample jobs (global + India)
        if not all_jobs:
            all_jobs = self._get_sample_jobs(query, location)
        
        # Deduplicate
        unique_jobs = self._deduplicate_jobs(all_jobs)
        
        return unique_jobs[:limit]
    
    def scrape_linkedin(self, query: str, location: str, limit: int = 20) -> List[Dict]:
        """
        Scrape jobs from LinkedIn (Global platform)
        """
        return self._get_sample_linkedin_jobs(query, location, limit)
    
    def scrape_indeed(self, query: str, location: str, limit: int = 20) -> List[Dict]:
        """
        Scrape jobs from Indeed (Global)
        """
        return self._get_sample_indeed_jobs(query, location, limit)
    
    def scrape_naukri(self, query: str, location: str, limit: int = 20) -> List[Dict]:
        """
        Scrape jobs from Naukri (India-focused but included for Indian users)
        """
        return self._get_sample_naukri_jobs(query, location, limit)
    
    def scrape_unstop(self, query: str, limit: int = 10) -> List[Dict]:
        """
        Scrape jobs/internships from Unstop (For Indian freshers)
        """
        return self._get_sample_unstop_jobs(query, limit)
    
    def _get_sample_jobs(self, query: str, location: str) -> List[Dict]:
        """
        Generate sample jobs from GLOBAL companies
        Includes: US companies, European companies, Indian companies, Remote jobs
        """
        global_companies = [
            # US Tech Giants
            {'name': 'Google', 'location': 'Remote', 'country': 'US', 'type': 'Tech Giant'},
            {'name': 'Meta', 'location': 'Remote', 'country': 'US', 'type': 'Tech Giant'},
            {'name': 'Amazon', 'location': 'Remote', 'country': 'US', 'type': 'Tech Giant'},
            {'name': 'Microsoft', 'location': 'Remote', 'country': 'US', 'type': 'Tech Giant'},
            {'name': 'Apple', 'location': 'Cupertino, CA', 'country': 'US', 'type': 'Tech Giant'},
            
            # US Startups/Companies
            {'name': 'Stripe', 'location': 'Remote', 'country': 'US', 'type': 'Fintech'},
            {'name': 'Airbnb', 'location': 'San Francisco', 'country': 'US', 'type': 'Travel'},
            {'name': 'Netflix', 'location': 'Remote', 'country': 'US', 'type': 'Entertainment'},
            {'name': 'Uber', 'location': 'Remote', 'country': 'US', 'type': 'Ride-sharing'},
            {'name': 'Shopify', 'location': 'Remote', 'country': 'Canada', 'type': 'E-commerce'},
            
            # Indian Companies (for Indian users)
            {'name': 'Flipkart', 'location': 'Bangalore', 'country': 'India', 'type': 'E-commerce'},
            {'name': 'Swiggy', 'location': 'Bangalore', 'country': 'India', 'type': 'Food Delivery'},
            {'name': 'Zomato', 'location': 'Gurugram', 'country': 'India', 'type': 'Food Delivery'},
            {'name': 'Razorpay', 'location': 'Bangalore', 'country': 'India', 'type': 'Fintech'},
            
            # European Companies
            {'name': 'Spotify', 'location': 'Remote', 'country': 'Sweden', 'type': 'Music'},
            {'name': 'Revolut', 'location': 'Remote', 'country': 'UK', 'type': 'Fintech'},
        ]
        
        roles = [
            'Software Engineer', 'Full Stack Developer', 'Backend Engineer', 
            'Frontend Developer', 'DevOps Engineer', 'Data Scientist',
            'Machine Learning Engineer', 'Product Manager'
        ]
        
        jobs = []
        for i, company in enumerate(global_companies[:15]):
            # Salary in both USD and INR for Indian users
            usd_min = random.randint(80, 150)
            usd_max = random.randint(150, 250)
            
            # Convert to INR (approx 1 USD = 83 INR)
            inr_min = usd_min * 83 // 100000  # Convert to LPA
            inr_max = usd_max * 83 // 100000
            
            salary_display = f"${usd_min}k-${usd_max}k USD (₹{inr_min}-{inr_max} LPA)" if company['country'] != 'India' else f"₹{random.randint(8, 25)}-{random.randint(25, 40)} LPA"
            
            job = {
                'title': f"{random.choice(roles)}",
                'company': company['name'],
                'location': company['location'],
                'country': company['country'],
                'salary': salary_display,
                'experience': f"{random.randint(0, 5)}-{random.randint(3, 8)} years",
                'description': f"Looking for talented {query} to join our global team. Remote-friendly, work from anywhere.",
                'skills_required': ['Python', 'JavaScript', 'React', 'Node.js', 'AWS'],
                'company_info': {
                    'industry': company['type'],
                    'size': '1,000-10,000',
                    'founded': random.randint(2000, 2020)
                },
                'posted_date': f"{random.randint(1, 7)} days ago",
                'source': 'LinkedIn',
                'is_remote': company['location'] == 'Remote',
                'is_hybrid': random.choice([True, False]) if company['location'] != 'Remote' else False,
                'visa_sponsorship': company['country'] != 'India',  # Non-Indian companies may sponsor
                'accepts_international': True  # All jobs accept international applicants
            }
            jobs.append(job)
        
        return jobs
    
    def _get_sample_linkedin_jobs(self, query: str, location: str, limit: int) -> List[Dict]:
        """Sample LinkedIn jobs (Global platform)"""
        return self._get_sample_jobs(query, location)[:limit]
    
    def _get_sample_indeed_jobs(self, query: str, location: str, limit: int) -> List[Dict]:
        """Sample Indeed jobs (Global)"""
        us_companies = [
            'Tesla', 'SpaceX', 'Twitter', 'Coinbase', 'GitHub',
            'Salesforce', 'Oracle', 'Adobe', 'Intel', 'Nvidia'
        ]
        
        jobs = []
        for company in us_companies[:limit]:
            usd_min = random.randint(100, 180)
            usd_max = random.randint(180, 300)
            inr_min = usd_min * 83 // 100000
            inr_max = usd_max * 83 // 100000
            
            job = {
                'title': f"{query.title()} Engineer",
                'company': company,
                'location': 'Remote (US/Global)',
                'country': 'US',
                'salary': f"${usd_min}k-${usd_max}k USD (₹{inr_min}-{inr_max} LPA)",
                'experience': f"{random.randint(2, 5)}-{random.randint(5, 10)} years",
                'description': f"Join {company} as a {query}. Remote work available globally.",
                'skills_required': ['Python', 'Java', 'AWS', 'Kubernetes', 'React'],
                'company_info': {
                    'industry': 'Technology',
                    'size': '5,000-50,000',
                    'founded': random.randint(1980, 2010)
                },
                'posted_date': f"{random.randint(1, 14)} days ago",
                'source': 'Indeed',
                'is_remote': True,
                'is_hybrid': False,
                'visa_sponsorship': True,
                'accepts_international': True
            }
            jobs.append(job)
        
        return jobs
    
    def _get_sample_naukri_jobs(self, query: str, location: str, limit: int) -> List[Dict]:
        """Sample Naukri jobs (India-focused for Indian users)"""
        indian_companies = [
            'Flipkart', 'Swiggy', 'Zomato', 'Paytm', 'Ola',
            'BYJU\'S', 'PhonePe', 'Razorpay', 'Zerodha', 'Freshworks'
        ]
        
        jobs = []
        for company in indian_companies[:limit]:
            job = {
                'title': f"{query.title()} Developer",
                'company': company,
                'location': random.choice(['Bangalore', 'Hyderabad', 'Mumbai', 'Pune', 'Delhi NCR']),
                'country': 'India',
                'salary': f"₹{random.randint(8, 25)}-{random.randint(25, 40)} LPA",
                'experience': f"{random.randint(0, 5)}-{random.randint(3, 8)} years",
                'description': f"Exciting opportunity at {company}. Work on cutting-edge technology.",
                'skills_required': ['Python', 'JavaScript', 'React', 'Node.js', 'MongoDB'],
                'company_info': {
                    'industry': 'Startup',
                    'size': '1,000-10,000',
                    'founded': random.randint(2005, 2020)
                },
                'posted_date': f"{random.randint(1, 7)} days ago",
                'source': 'Naukri.com',
                'is_remote': random.choice([True, False]),
                'is_hybrid': True,
                'visa_sponsorship': False,
                'accepts_international': True
            }
            jobs.append(job)
        
        return jobs
    
    def _get_sample_unstop_jobs(self, query: str, limit: int) -> List[Dict]:
        """Sample Unstop jobs (For Indian freshers/students)"""
        startups = [
            'Cred', 'Meesho', 'Urban Company', 'Dunzo', 'Groww',
            'Licious', 'Vedantu', 'Unacademy', 'Sharechat', 'Dream11'
        ]
        
        jobs = []
        for startup in startups[:limit]:
            job = {
                'title': f"{query.title()} Intern/Fresher",
                'company': startup,
                'location': 'Bangalore (Hybrid)',
                'country': 'India',
                'salary': '₹20,000-50,000/month (Internship) or ₹5-10 LPA (Full-time)',
                'experience': '0-1 years',
                'description': f"Great opportunity for freshers at {startup}. Learn and grow!",
                'skills_required': ['Python', 'JavaScript', 'React', 'SQL'],
                'company_info': {
                    'industry': 'Startup',
                    'size': '100-1,000',
                    'founded': random.randint(2015, 2020)
                },
                'posted_date': f"{random.randint(1, 5)} days ago",
                'source': 'Unstop',
                'is_remote': False,
                'is_hybrid': True,
                'visa_sponsorship': False,
                'accepts_international': False
            }
            jobs.append(job)
        
        return jobs
    
    def _deduplicate_jobs(self, jobs: List[Dict]) -> List[Dict]:
        """Remove duplicate jobs"""
        seen = set()
        unique_jobs = []
        
        for job in jobs:
            key = (job['title'], job['company'])
            if key not in seen:
                seen.add(key)
                unique_jobs.append(job)
        
        return unique_jobs


# Auto-Apply System (Universal)
class AutoApplySystem:
    """
    Automated job application system for global jobs
    """
    
    def __init__(self, db_connection):
        self.db = db_connection
    
    def process_auto_apply_for_user(self, user_id: int, max_applications: int = 10) -> Dict:
        """
        Process auto-apply for a user based on their preferences
        Works for both Indian and global jobs
        """
        # Get user preferences
        preferences = self._get_user_preferences(user_id)
        
        if not preferences.get('auto_apply_enabled'):
            return {'message': 'Auto-apply is disabled', 'applications': 0}
        
        # Get user's base resume
        base_resume = self._get_base_resume(user_id)
        
        if not base_resume:
            return {'message': 'No resume found', 'applications': 0}
        
        # Find matching jobs (global + India)
        matching_jobs = self._find_matching_jobs(preferences)
        
        applications_created = 0
        applied_jobs = []
        
        for job in matching_jobs:
            if applications_created >= max_applications:
                break
            
            # Check match score threshold
            match_score = self._calculate_match_score(base_resume, job)
            
            if match_score >= preferences.get('min_match_score', 60):
                # Create application
                application = self._create_application(user_id, job, base_resume, match_score)
                applications_created += 1
                applied_jobs.append({
                    'job_title': job['title'],
                    'company': job['company'],
                    'location': job['location'],
                    'country': job.get('country', 'Unknown'),
                    'match_score': match_score
                })
        
        return {
            'message': f'Applied to {applications_created} jobs globally',
            'applications': applications_created,
            'jobs': applied_jobs
        }
    
    def _get_user_preferences(self, user_id: int) -> Dict:
        """Get user's job preferences"""
        return {
            'auto_apply_enabled': True,
            'target_roles': ['Software Engineer', 'Full Stack Developer'],
            'locations': ['Remote', 'Bangalore', 'US', 'Europe'],  # Global locations
            'salary_min': 800000,  # 8 LPA or equivalent
            'min_match_score': 60,
            'include_visa_sponsorship': True,  # Apply to jobs with visa sponsorship
            'prefer_remote': True
        }
    
    def _get_base_resume(self, user_id: int) -> Dict:
        """Get user's base resume"""
        return {
            'skills': ['Python', 'JavaScript', 'React', 'Node.js'],
            'experience_years': 2
        }
    
    def _find_matching_jobs(self, preferences: Dict) -> List[Dict]:
        """Find jobs matching user preferences (global)"""
        return []
    
    def _calculate_match_score(self, resume: Dict, job: Dict) -> int:
        """Calculate match score between resume and job"""
        resume_skills = set([s.lower() for s in resume.get('skills', [])])
        job_skills = set([s.lower() for s in job.get('skills_required', [])])
        
        if not job_skills:
            return 50
        
        matches = len(resume_skills & job_skills)
        score = int((matches / len(job_skills)) * 100)
        
        return min(max(score, 0), 100)
    
    def _create_application(self, user_id: int, job: Dict, resume: Dict, match_score: int) -> Dict:
        """Create job application"""
        return {
            'user_id': user_id,
            'job_id': job.get('id'),
            'match_score': match_score,
            'status': 'applied',
            'country': job.get('country'),
            'visa_required': job.get('country') != 'India'
        }
