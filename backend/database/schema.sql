
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  name VARCHAR(255),
  phone VARCHAR(20),
  location VARCHAR(100),
  current_role VARCHAR(100),
  current_company VARCHAR(100),
  total_years FLOAT,
  current_ctc FLOAT, -- In LPA
  expected_ctc FLOAT, -- In LPA
  notice_period INT, -- In days
  skills TEXT[],
  preferences JSONB DEFAULT '{}',
  subscription_tier VARCHAR(20) DEFAULT 'free',
  credits INT DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Jobs Table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  company VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(100),
  salary_min FLOAT, -- In LPA
  salary_max FLOAT, -- In LPA
  experience_min FLOAT,
  experience_max FLOAT,
  skills_required TEXT[],
  source VARCHAR(50), -- naukri, linkedin, etc.
  external_link TEXT,
  posted_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Resumes Table
CREATE TABLE IF NOT EXISTS resumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  original_url TEXT,
  parsed_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Job Matches Table
CREATE TABLE IF NOT EXISTS job_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  match_score INT,
  reasons JSONB,
  is_viewed BOOLEAN DEFAULT FALSE,
  is_saved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, job_id)
);

-- Applications Table
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'applied', -- applied, screening, interview, offer, rejected
  resume_version_id UUID, -- Reference to specific resume version used
  cover_letter TEXT,
  notes TEXT,
  applied_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Resume Versions (Tailored)
CREATE TABLE IF NOT EXISTS resume_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  content JSONB,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company);
CREATE INDEX IF NOT EXISTS idx_job_matches_user ON job_matches(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_user ON applications(user_id);
