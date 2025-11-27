-- JoBika Database Schema for PostgreSQL (Supabase)
-- Complete schema with all tables, indexes, and constraints

-- ============================================
-- CORE TABLES
-- ============================================

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(50),
    two_factor_secret VARCHAR(255),
    is_two_factor_enabled BOOLEAN DEFAULT FALSE,
    oauth_provider VARCHAR(50),
    oauth_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Resumes Table
CREATE TABLE IF NOT EXISTS resumes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    filename VARCHAR(255),
    original_text TEXT,
    enhanced_text TEXT,
    skills TEXT,  -- JSON array stored as text
    experience_years INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Jobs Table
CREATE TABLE IF NOT EXISTS jobs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    salary VARCHAR(100),
    description TEXT,
    required_skills TEXT,  -- JSON array stored as text
    posted_date VARCHAR(50),
    source VARCHAR(100),
    is_remote BOOLEAN DEFAULT FALSE,
    is_hybrid BOOLEAN DEFAULT FALSE,
    experience_required VARCHAR(100),
    company_size VARCHAR(50),
    company_industry VARCHAR(100),
    application_deadline VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Applications Table
CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    job_id INTEGER NOT NULL,
    resume_id INTEGER,
    resume_version_id INTEGER,
    status VARCHAR(50) DEFAULT 'applied',
    match_score INTEGER,
    applied_date VARCHAR(50),
    cover_letter TEXT,
    auto_applied BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE SET NULL
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- AI AGENT FEATURE TABLES
-- ============================================

-- Resume Versions Table
CREATE TABLE IF NOT EXISTS resume_versions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    base_resume_id INTEGER NOT NULL,
    job_id INTEGER,
    version_name VARCHAR(255) NOT NULL,
    customized_summary TEXT,
    customized_skills TEXT,  -- JSON array
    customized_projects TEXT,  -- JSON array
    customized_experience TEXT,  -- JSON array
    match_score INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (base_resume_id) REFERENCES resumes(id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL
);

-- AI Suggestions Table
CREATE TABLE IF NOT EXISTS ai_suggestions (
    id SERIAL PRIMARY KEY,
    resume_id INTEGER NOT NULL,
    section VARCHAR(50) NOT NULL,  -- 'summary', 'skills', 'projects', 'experience'
    original_text TEXT,
    suggested_text TEXT,
    accepted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
);

-- User Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    target_roles TEXT,  -- JSON array: ['Software Engineer', 'Full Stack Developer']
    preferred_locations TEXT,  -- JSON array: ['Bangalore', 'Remote', 'Hyderabad']
    salary_min INTEGER,  -- Minimum salary
    salary_max INTEGER,  -- Maximum salary
    experience_level VARCHAR(50),  -- 'Fresher', 'Mid-level', 'Senior'
    company_types TEXT,  -- JSON array: ['Startup', 'MNC', 'Product']
    auto_apply_enabled BOOLEAN DEFAULT FALSE,
    max_applications_per_day INTEGER DEFAULT 10,
    min_match_score INTEGER DEFAULT 60,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Skill Gap Analysis Table
CREATE TABLE IF NOT EXISTS skill_gaps (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    job_id INTEGER NOT NULL,
    matching_skills TEXT,  -- JSON array
    missing_skills TEXT,  -- JSON array
    match_score INTEGER,
    recommendations TEXT,  -- JSON array of learning recommendations
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

-- Saved Jobs Table
CREATE TABLE IF NOT EXISTS saved_jobs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    job_id INTEGER NOT NULL,
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    UNIQUE(user_id, job_id)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_resumes_user ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
CREATE INDEX IF NOT EXISTS idx_jobs_source ON jobs(source);
CREATE INDEX IF NOT EXISTS idx_jobs_remote ON jobs(is_remote);
CREATE INDEX IF NOT EXISTS idx_applications_user ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_job ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_user_status ON applications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_versions_user ON resume_versions(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_versions_job ON resume_versions(job_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_resume ON ai_suggestions(resume_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_gaps_user ON skill_gaps(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_gaps_job ON skill_gaps(job_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_user ON saved_jobs(user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- NOTE: RLS is disabled for this deployment as we're using custom JWT authentication
-- at the application level. If you want to use Supabase Auth, uncomment the sections below.

-- Enable RLS on all tables (DISABLED)
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE resume_versions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE skill_gaps ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;

-- Jobs table is public (no RLS needed)
-- Users can only access their own data

-- Users policies (DISABLED)
-- CREATE POLICY users_select_own ON users FOR SELECT USING (auth.uid()::text = id::text);
-- CREATE POLICY users_update_own ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- Resumes policies (DISABLED)
-- CREATE POLICY resumes_select_own ON resumes FOR SELECT USING (auth.uid()::text = user_id::text);
-- CREATE POLICY resumes_insert_own ON resumes FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
-- CREATE POLICY resumes_update_own ON resumes FOR UPDATE USING (auth.uid()::text = user_id::text);
-- CREATE POLICY resumes_delete_own ON resumes FOR DELETE USING (auth.uid()::text = user_id::text);

-- Applications policies (DISABLED)
-- CREATE POLICY applications_select_own ON applications FOR SELECT USING (auth.uid()::text = user_id::text);
-- CREATE POLICY applications_insert_own ON applications FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
-- CREATE POLICY applications_update_own ON applications FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Notifications policies (DISABLED)
-- CREATE POLICY notifications_select_own ON notifications FOR SELECT USING (auth.uid()::text = user_id::text);
-- CREATE POLICY notifications_update_own ON notifications FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Resume versions policies (DISABLED)
-- CREATE POLICY resume_versions_select_own ON resume_versions FOR SELECT USING (auth.uid()::text = user_id::text);
-- CREATE POLICY resume_versions_insert_own ON resume_versions FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- User preferences policies (DISABLED)
-- CREATE POLICY user_preferences_select_own ON user_preferences FOR SELECT USING (auth.uid()::text = user_id::text);
-- CREATE POLICY user_preferences_insert_own ON user_preferences FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
-- CREATE POLICY user_preferences_update_own ON user_preferences FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Skill gaps policies (DISABLED)
-- CREATE POLICY skill_gaps_select_own ON skill_gaps FOR SELECT USING (auth.uid()::text = user_id::text);
-- CREATE POLICY skill_gaps_insert_own ON skill_gaps FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Saved jobs policies (DISABLED)
-- CREATE POLICY saved_jobs_select_own ON saved_jobs FOR SELECT USING (auth.uid()::text = user_id::text);
-- CREATE POLICY saved_jobs_insert_own ON saved_jobs FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
-- CREATE POLICY saved_jobs_delete_own ON saved_jobs FOR DELETE USING (auth.uid()::text = user_id::text);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user_preferences
CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA (Optional - for testing)
-- ============================================

-- Insert sample jobs (optional)
-- INSERT INTO jobs (title, company, location, salary, description, required_skills, source, is_remote)
-- VALUES 
-- ('Software Engineer', 'Google', 'Remote', '$150,000 - $200,000', 'Build amazing products', '["Python", "JavaScript", "React"]', 'LinkedIn', true),
-- ('Full Stack Developer', 'Microsoft', 'Bangalore', '₹20-28 LPA', 'Work on cloud solutions', '["Node.js", "Azure", "TypeScript"]', 'Naukri', false);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;

-- Note: RLS policies are disabled for this deployment
