"""
Salary Insights API for JoBika
Provides salary data and market insights for job positions
"""

import random
from datetime import datetime

class SalaryInsightsSystem:
    """Generate salary insights and market data"""
    
    def __init__(self):
        # Sample salary ranges by role (in USD)
        self.salary_data = {
            'software engineer': {'min': 80000, 'max': 180000, 'median': 120000},
            'senior software engineer': {'min': 120000, 'max': 220000, 'median': 160000},
            'data scientist': {'min': 90000, 'max': 190000, 'median': 130000},
            'product manager': {'min': 100000, 'max': 200000, 'median': 140000},
            'frontend developer': {'min': 70000, 'max': 150000, 'median': 100000},
            'backend developer': {'min': 80000, 'max': 170000, 'median': 115000},
            'full stack developer': {'min': 85000, 'max': 175000, 'median': 120000},
            'devops engineer': {'min': 90000, 'max': 180000, 'median': 125000},
            'machine learning engineer': {'min': 100000, 'max': 210000, 'median': 145000},
            'ui ux designer': {'min': 65000, 'max': 140000, 'median': 95000},
            'qa engineer': {'min': 60000, 'max': 130000, 'median': 85000},
        }
        
        # Location multipliers
        self.location_multipliers = {
            'san francisco': 1.4,
            'new york': 1.3,
            'seattle': 1.25,
            'boston': 1.2,
            'austin': 1.1,
            'remote': 1.0,
            'bangalore': 0.3,
            'london': 1.25,
            'default': 1.0
        }
    
    def get_salary_insights(self, job_title, location='remote', experience_years=2):
        """
        Get salary insights for a job
        
        Args:
            job_title: Job position title
            location: Job location
            experience_years: Years of experience
        
        Returns:
            dict with salary insights
        """
        # Normalize title
        title_key = self._normalize_title(job_title)
        
        # Get base salary range
        base_range = self.salary_data.get(title_key, 
            {'min': 60000, 'max': 150000, 'median': 90000})
        
        # Apply location multiplier
        location_mult = self._get_location_multiplier(location)
        
        # Apply experience multiplier
        exp_mult = 1 + (experience_years * 0.05)  # 5% per year
        exp_mult = min(exp_mult, 2.0)  # Cap at 2x
        
        # Calculate final range
        salary_min = int(base_range['min'] * location_mult * exp_mult)
        salary_max = int(base_range['max'] * location_mult * exp_mult)
        salary_median = int(base_range['median'] * location_mult * exp_mult)
        
        # Generate insights
        percentile_25 = int(salary_min + (salary_median - salary_min) * 0.5)
        percentile_75 = int(salary_median + (salary_max - salary_median) * 0.5)
        
        return {
            'job_title': job_title,
            'location': location,
            'experience_years': experience_years,
            'salary_range': {
                'min': salary_min,
                'max': salary_max,
                'median': salary_median,
                'percentile_25': percentile_25,
                'percentile_75': percentile_75,
                'currency': 'USD'
            },
            'market_insights': {
                'demand': self._get_demand_level(title_key),
                'growth_trend': self._get_growth_trend(title_key),
                'competition': self._get_competition_level(title_key),
                'skills_premium': self._get_top_skills(title_key)
            },
            'comparison': {
                'vs_national_avg': self._compare_to_national(salary_median, title_key),
                'vs_location_avg': self._compare_to_location(salary_median, location)
            }
        }
    
    def _normalize_title(self, title):
        """Normalize job title for lookup"""
        title_lower = title.lower()
        for key in self.salary_data.keys():
            if key in title_lower:
                return key
        return 'software engineer'  # default
    
    def _get_location_multiplier(self, location):
        """Get salary multiplier for location"""
        location_lower = location.lower()
        for key, mult in self.location_multipliers.items():
            if key in location_lower:
                return mult
        return self.location_multipliers['default']
    
    def _get_demand_level(self, title_key):
        """Get demand level for role"""
        high_demand = ['machine learning engineer', 'devops engineer', 'data scientist']
        if title_key in high_demand:
            return 'High'
        return random.choice(['Medium', 'High'])
    
    def _get_growth_trend(self, title_key):
        """Get growth trend"""
        growing = ['machine learning engineer', 'data scientist', 'devops engineer']
        if title_key in growing:
            return 'Growing (↑ 15%)'
        return random.choice(['Stable', 'Growing (↑ 8%)'])
    
    def _get_competition_level(self, title_key):
        """Get competition level"""
        return random.choice(['Moderate', 'High', 'Medium'])
    
    def _get_top_skills(self, title_key):
        """Get skills that command premium"""
        skills_map = {
            'software engineer': ['System Design', 'AWS', 'Kubernetes'],
            'data scientist': ['Deep Learning', 'MLOps', 'Python'],
            'frontend developer': ['React', 'TypeScript', 'Next.js'],
            'backend developer': ['Microservices', 'Docker', 'PostgreSQL'],
        }
        return skills_map.get(title_key, ['Cloud', 'Agile', 'Leadership'])
    
    def _compare_to_national(self, salary, title_key):
        """Compare to national average"""
        base = self.salary_data.get(title_key, {}).get('median', 100000)
        diff_pct = ((salary - base) / base) * 100
        if diff_pct > 10:
            return f'+{int(diff_pct)}% above national avg'
        elif diff_pct < -10:
            return f'{int(diff_pct)}% below national avg'
        return 'On par with national avg'
    
    def _compare_to_location(self, salary, location):
        """Compare to location average"""
        mult = self._get_location_multiplier(location)
        if mult > 1.2:
            return 'Premium market location'
        elif mult < 0.5:
            return 'Lower cost market'
        return 'Average cost market'

# Global instance
salary_insights = SalaryInsightsSystem()

def init_salary_insights_endpoints(app):
    """Initialize salary insights endpoints"""
    from flask import request, jsonify
    
    @app.route('/api/salary/insights', methods=['POST'])
    def get_salary_insights():
        """Get salary insights for a job"""
        data = request.json
        job_title = data.get('jobTitle', 'Software Engineer')
        location = data.get('location', 'Remote')
        experience_years = data.get('experienceYears', 2)
        
        insights = salary_insights.get_salary_insights(
            job_title, location, experience_years
        )
        
        return jsonify(insights)
    
    @app.route('/api/salary/compare', methods=['POST'])
    def compare_salaries():
        """Compare salaries for multiple roles"""
        data = request.json
        roles = data.get('roles', [])
        
        results = []
        for role in roles[:5]:  # Limit to 5 comparisons
            insights = salary_insights.get_salary_insights(
                role.get('title', 'Software Engineer'),
                role.get('location', 'Remote'),
                role.get('experience', 2)
            )
            results.append(insights)
        
        return jsonify({'comparisons': results})
    
    print("✅ Salary insights endpoints initialized")
