-- SQLite Schema for JobSaathi

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  name TEXT,
  phone TEXT,
  location TEXT,
  current_role TEXT,
  current_company TEXT,
  total_years REAL,
  current_ctc REAL,
  expected_ctc REAL,
  notice_period INTEGER,
  skills TEXT, -- JSON string or comma-separated
  preferences TEXT, -- JSON string
  subscription_tier TEXT DEFAULT 'free',
  credits INTEGER DEFAULT 10,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Jobs Table
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  description TEXT,
  location TEXT,
  salary_min REAL,
  salary_max REAL,
  experience_min REAL,
  experience_max REAL,
  skills_required TEXT, -- JSON string
  source TEXT,
  external_link TEXT,
  posted_date DATETIME,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Resumes Table
CREATE TABLE IF NOT EXISTS resumes (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  original_url TEXT,
  parsed_data TEXT, -- JSON string
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Job Matches Table
CREATE TABLE IF NOT EXISTS job_matches (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  job_id TEXT,
  match_score INTEGER,
  reasons TEXT, -- JSON string
  is_viewed INTEGER DEFAULT 0,
  is_saved INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  UNIQUE(user_id, job_id)
);

-- Applications Table
CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  job_id TEXT,
  status TEXT DEFAULT 'applied',
  resume_version_id TEXT,
  cover_letter TEXT,
  notes TEXT,
  applied_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

-- Resume Versions (Tailored)
CREATE TABLE IF NOT EXISTS resume_versions (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  job_id TEXT,
  content TEXT, -- JSON string
  pdf_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company);
CREATE INDEX IF NOT EXISTS idx_job_matches_user ON job_matches(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_user ON applications(user_id);
