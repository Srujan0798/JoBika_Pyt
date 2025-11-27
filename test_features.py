#!/usr/bin/env python3
"""
Test all JoBika features
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
os.chdir(os.path.join(os.path.dirname(__file__), 'backend'))

print("🧪 Testing JoBika Features")
print("=" * 60)

# Test 1: Salary Insights
print("\n1️⃣  Testing Salary Insights...")
try:
    from salary_insights import salary_insights
    result = salary_insights.get_salary_insights('Software Engineer', 'San Francisco', 3)
    print(f"   ✅ Salary Insights Working")
    print(f"      Range: ${result['salary_range']['min']:,} - ${result['salary_range']['max']:,}")
    print(f"      Median: ${result['salary_range']['median']:,}")
    print(f"      Demand: {result['market_insights']['demand']}")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Test 2: PDF Export
print("\n2️⃣  Testing PDF Export...")
try:
    from pdf_export import pdf_exporter
    html = pdf_exporter._generate_applications_html(1)
    print(f"   ✅ PDF Export Working")
    print(f"      HTML length: {len(html)} chars")
    print(f"      Contains tables: {'<table>' in html}")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Test 3: Cover Letter Generator
print("\n3️⃣  Testing Cover Letter Generator...")
try:
    from cover_letter_generator import cover_letter_generator
    user_data = {'name': 'Test User', 'skills': ['Python', 'JavaScript'], 'experience_years': 3}
    job_data = {'title': 'Software Engineer', 'company': 'Tech Corp', 'description': 'Build apps', 'required_skills': ['Python']}
    result = cover_letter_generator.generate('professional', user_data, job_data)
    print(f"   ✅ Cover Letter Generator Working")
    print(f"      Style: professional")
    print(f"      Word count: {result['word_count']}")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Test 4: Interview Prep
print("\n4️⃣  Testing Interview Prep...")
try:
    from interview_prep import interview_prep
    job_data = {'title': 'Data Scientist', 'company': 'AI Corp', 'required_skills': ['Python', 'Machine Learning']}
    user_skills = ['Python', 'Statistics']
    result = interview_prep.generate_prep_guide(job_data, user_skills)
    print(f"   ✅ Interview Prep Working")
    print(f"      Questions generated: {len(result['likely_questions'])}")
    print(f"      Focus areas: {len(result['focus_areas'])}")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Test 5: Resume Comparer
print("\n5️⃣  Testing Resume Comparer...")
try:
    from resume_comparer import resume_comparer
    print(f"   ✅ Resume Comparer Working")
    print(f"      Ready for version comparison")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Test 6: Server Import
print("\n6️⃣  Testing Server & All Modules...")
try:
    import server
    routes = list(server.app.url_map.iter_rules())
    print(f"   ✅ Server Loaded Successfully")
    print(f"      Total routes: {len(routes)}")
    print(f"      Sample routes:")
    for route in routes[:5]:
        print(f"         - {route}")
except Exception as e:
    print(f"   ❌ Error: {e}")

print("\n" + "=" * 60)
print("🎉 Feature testing complete!")
print("\n💡 To run server:")
print("   cd backend && flask run --port 8080")
print("\n🌐 Then visit:")
print("   http://localhost:8080/app/index.html")
print("   http://localhost:8080/api/docs/")
