# Database Migration Script
# Run this to add new tables for AI agent features

import sqlite3

def migrate_database():
    """Add new tables for AI agent features"""
    conn = sqlite3.connect('jobika.db')
    cursor = conn.cursor()
    
    print("🔄 Running database migration...")
    
    # Resume Versions Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS resume_versions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            base_resume_id INTEGER NOT NULL,
            job_id INTEGER,
            version_name TEXT NOT NULL,
            customized_summary TEXT,
            customized_skills TEXT,
            customized_projects TEXT,
            customized_experience TEXT,
            match_score INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (base_resume_id) REFERENCES resumes(id),
            FOREIGN KEY (job_id) REFERENCES jobs(id)
        )
    ''')
    print("✅ Created resume_versions table")
    
    # AI Suggestions Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS ai_suggestions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            resume_id INTEGER NOT NULL,
            section TEXT NOT NULL,
            original_text TEXT,
            suggested_text TEXT,
            accepted BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (resume_id) REFERENCES resumes(id)
        )
    ''')
    print("✅ Created ai_suggestions table")
    
    # User Preferences Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_preferences (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL UNIQUE,
            target_roles TEXT,
            preferred_locations TEXT,
            salary_min INTEGER,
            salary_max INTEGER,
            experience_level TEXT,
            company_types TEXT,
            auto_apply_enabled BOOLEAN DEFAULT FALSE,
            max_applications_per_day INTEGER DEFAULT 10,
            min_match_score INTEGER DEFAULT 60,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')
    print("✅ Created user_preferences table")
    
    # Skill Gap Analysis Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS skill_gaps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            job_id INTEGER NOT NULL,
            matching_skills TEXT,
            missing_skills TEXT,
            match_score INTEGER,
            recommendations TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (job_id) REFERENCES jobs(id)
        )
    ''')
    print("✅ Created skill_gaps table")
    
    # Create indexes
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_resume_versions_user ON resume_versions(user_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_resume_versions_job ON resume_versions(job_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_ai_suggestions_resume ON ai_suggestions(resume_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_skill_gaps_user ON skill_gaps(user_id)')
    print("✅ Created indexes")
    
    conn.commit()
    conn.close()
    
    print("✅ Database migration completed successfully!")

if __name__ == '__main__':
    migrate_database()
