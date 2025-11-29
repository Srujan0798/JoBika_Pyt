-- CLEAN SLATE: Drop all existing tables first
-- Run this in Supabase SQL Editor to start fresh

-- Drop all tables in reverse order (to handle foreign keys)
DROP TABLE IF EXISTS application_events CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS saved_jobs CASCADE;
DROP TABLE IF EXISTS job_alerts CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS insider_connections CASCADE;
DROP TABLE IF EXISTS usage_tracking CASCADE;
DROP TABLE IF EXISTS resumes CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS user_skills CASCADE;
DROP TABLE IF EXISTS user_experience CASCADE;
DROP TABLE IF EXISTS user_education CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Now create fresh schema...
-- (The rest of the schema will be in postgres_schema.sql)
