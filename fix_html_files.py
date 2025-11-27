#!/usr/bin/env python3
"""
Fix all API URLs and navigation links in HTML files
"""
import os
import re

app_dir = os.path.join(os.path.dirname(__file__), 'app')

# Files to fix
html_files = [
    'auth.html', 'dashboard.html', 'jobs.html', 'upload.html', 
    'editor.html', 'tracker.html', 'resume-versions.html',
    'preferences.html', 'analytics.html', 'profile.html'
]

fixes_made = 0

for filename in html_files:
    filepath = os.path.join(app_dir, filename)
    if not os.path.exists(filepath):
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Fix 1: Replace http://localhost:5000 with /api (relative to current server)
    content = content.replace('http://localhost:5000/api', '/api')
    content = content.replace("'http://localhost:5000/api'", "'/api'")
    content = content.replace('"http://localhost:5000/api"', '"/api"')
    
    # Fix 2: Fix Settings link - find <a href="#" class="nav-link"> with Settings icon/text
    # Replace Settings link that points to #
    content = re.sub(
        r'<a href="#" class="nav-link">\s*<svg[^>]*>.*?</svg>\s*Settings\s*</a>',
        '<a href="preferences.html" class="nav-link">\\n                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"\\n                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\\n                        <circle cx="12" cy="12" r="3"></circle>\\n                        <path\\n                            d="M12 1v6m0 6v6m0-6h6m-6 0H6m12.22-7.78l-4.24 4.24m0 0l-4.24 4.24m4.24-4.24l4.24 4.24M7.76 7.76l4.24 4.24">\\n                        </path>\\n                    </svg>\\n                    Settings\\n                </a>',
        content,
        flags=re.DOTALL
    )
    
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        fixes_made += 1
        print(f"✅ Fixed {filename}")

print(f"\\n🎉 Fixed {fixes_made} files!")
print("\\nChanges made:")
print("1. ✅ Changed API URLs from http://localhost:5000/api to /api")
print("2. ✅ Fixed Settings navigation links")
