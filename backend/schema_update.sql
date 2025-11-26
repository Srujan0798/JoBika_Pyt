# JoBika Database Schema Update
# SQL script to add new tables for AI agent features

-- Resume Versions Table
-- Stores customized resume versions for each job application
CREATE TABLE IF NOT EXISTS resume_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    base_resume_id INTEGER NOT NULL,
    job_id INTEGER,
    version_name TEXT NOT NULL,
    customized_summary TEXT,
    customized_skills TEXT,  -- JSON array
    customized_projects TEXT,  -- JSON array
    customized_experience TEXT,  -- JSON array
    match_score INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (base_resume_id) REFERENCES resumes(id),
    FOREIGN KEY (job_id) REFERENCES jobs(id)
);

-- AI Suggestions Table
-- Stores AI-generated suggestions for resume improvement
CREATE TABLE IF NOT EXISTS ai_suggestions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resume_id INTEGER NOT NULL,
    section TEXT NOT NULL,  -- 'summary', 'skills', 'projects', 'experience'
    original_text TEXT,
    suggested_text TEXT,
    accepted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resume_id) REFERENCES resumes(id)
);

-- User Preferences Table
-- Stores user's job search preferences for auto-apply
CREATE TABLE IF NOT EXISTS user_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    target_roles TEXT,  -- JSON array: ['Software Engineer', 'Full Stack Developer']
    preferred_locations TEXT,  -- JSON array: ['Bangalore', 'Remote', 'Hyderabad']
    salary_min INTEGER,  -- Minimum salary in INR (e.g., 800000 for 8 LPA)
    salary_max INTEGER,  -- Maximum salary in INR
    experience_level TEXT,  -- 'Fresher', 'Mid-level', 'Senior'
    company_types TEXT,  -- JSON array: ['Startup', 'MNC', 'Product']
    auto_apply_enabled BOOLEAN DEFAULT FALSE,
    max_applications_per_day INTEGER DEFAULT 10,
    min_match_score INTEGER DEFAULT 60,  -- Minimum match score to auto-apply
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Skill Gap Analysis Table
-- Stores skill gap analysis results
CREATE TABLE IF NOT EXISTS skill_gaps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    job_id INTEGER NOT NULL,
    matching_skills TEXT,  -- JSON array
    missing_skills TEXT,  -- JSON array
    match_score INTEGER,
    recommendations TEXT,  -- JSON array of learning recommendations
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (job_id) REFERENCES jobs(id)
);

-- Application History Table Enhancement
-- Add columns to existing applications table
ALTER TABLE applications ADD COLUMN resume_version_id INTEGER;
ALTER TABLE applications ADD COLUMN cover_letter TEXT;
ALTER TABLE applications ADD COLUMN auto_applied BOOLEAN DEFAULT FALSE;

-- Job Metadata Enhancement
-- Add columns to existing jobs table
ALTER TABLE jobs ADD COLUMN is_remote BOOLEAN DEFAULT FALSE;
ALTER TABLE jobs ADD COLUMN is_hybrid BOOLEAN DEFAULT FALSE;
ALTER TABLE jobs ADD COLUMN experience_required TEXT;
ALTER TABLE jobs ADD COLUMN company_size TEXT;
ALTER TABLE jobs ADD COLUMN company_industry TEXT;
ALTER TABLE jobs ADD COLUMN application_deadline TEXT;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_resume_versions_user ON resume_versions(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_versions_job ON resume_versions(job_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_resume ON ai_suggestions(resume_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_gaps_user ON skill_gaps(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_user_status ON applications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
CREATE INDEX IF NOT EXISTS idx_jobs_source ON jobs(source);
