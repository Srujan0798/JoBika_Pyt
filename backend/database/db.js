const { Pool } = require('pg');
const sqlite3 = require('better-sqlite3');

/**
 * Universal Database Manager
 * Supports both SQLite (localhost) and PostgreSQL (production)
 */
class DatabaseManager {
    constructor() {
        this.isProduction = process.env.NODE_ENV === 'production';
        this.dbType = process.env.DATABASE_TYPE || (this.isProduction ? 'postgres' : 'sqlite');

        if (this.dbType === 'postgres') {
            this.initPostgres();
        } else {
            this.initSQLite();
        }
    }

    initPostgres() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.DATABASE_SSL === 'true' ? {
                rejectUnauthorized: false
            } : false,
            max: 20, // Connection pool size
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });

        this.pool.on('error', (err) => {
            console.error('Unexpected PostgreSQL error', err);
        });

        console.log('✅ PostgreSQL connection pool initialized');
    }

    initSQLite() {
        const path = require('path');
        this.dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'jobika.db');
        this.db = sqlite3(this.dbPath);

        // Initialize schema
        this.initializeSchema();
        console.log('✅ SQLite database initialized:', this.dbPath);
    }

    async query(sql, params = []) {
        try {
            if (this.dbType === 'postgres') {
                // PostgreSQL
                const result = await this.pool.query(sql, params);
                return {
                    rows: result.rows,
                    rowCount: result.rowCount,
                    lastInsertRowid: result.rows[0]?.id
                };
            } else {
                // SQLite
                const stmt = this.db.prepare(sql);

                if (sql.trim().toUpperCase().startsWith('SELECT')) {
                    const rows = stmt.all(...params);
                    return { rows, rowCount: rows.length };
                } else {
                    const result = stmt.run(...params);
                    return {
                        rows: [],
                        rowCount: result.changes,
                        lastInsertRowid: result.lastInsertRowid
                    };
                }
            }
        } catch (error) {
            console.error('Database query error:', error);
            console.error('Query:', sql);
            console.error('Params:', params);
            throw error;
        }
    }

    // Safe parameterized query helper
    async safeQuery(sql, params = []) {
        // SQL Injection Prevention: Ensure parameterized
        if (sql.includes('${') || sql.includes('+')) {
            throw new Error('SQL injection risk detected! Use parameterized queries.');
        }
        return this.query(sql, params);
    }

    initializeSchema() {
        if (this.dbType !== 'sqlite') return;

        const schema = `
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                name TEXT,
                phone TEXT,
                current_company TEXT,
                current_role TEXT,
                total_years INTEGER,
                current_ctc REAL,
                expected_ctc REAL,
                notice_period INTEGER,
                location TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS applications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                job_id INTEGER,
                company TEXT NOT NULL,
                role TEXT NOT NULL,
                location TEXT,
                job_url TEXT,
                status TEXT DEFAULT 'Applied',
                applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                notes TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS jobs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                company TEXT NOT NULL,
                location TEXT,
                description TEXT,
                requirements TEXT,
                salary_min REAL,
                salary_max REAL,
                experience_min INTEGER,
                experience_max INTEGER,
                job_type TEXT,
                source TEXT,
                source_url TEXT UNIQUE,
                posted_date DATETIME,
                scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT 1
            );

            CREATE TABLE IF NOT EXISTS resumes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                user_name TEXT,
                user_email TEXT,
                content TEXT NOT NULL,
                original_filename TEXT,
                uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS resume_versions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                job_id INTEGER,
                content TEXT NOT NULL,
                pdf_path TEXT,
                ats_score REAL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (job_id) REFERENCES jobs(id)
            );

            CREATE TABLE IF NOT EXISTS chat_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                role TEXT NOT NULL,
                message TEXT NOT NULL,
                folder TEXT DEFAULT 'All',
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );

            CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
            CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
            CREATE INDEX IF NOT EXISTS idx_jobs_is_active ON jobs(is_active);
            CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company);
            CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
            CREATE INDEX IF NOT EXISTS idx_chat_user_id ON chat_history(user_id);
        `;

        const statements = schema.split(';').filter(s => s.trim());
        statements.forEach(stmt => {
            if (stmt.trim()) {
                this.db.exec(stmt);
            }
        });

        console.log('Database initialized successfully');
    }

    // Add PostgreSQL schema creation
    async initializePostgresSchema() {
        const schema = `
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                name VARCHAR(255),
                phone VARCHAR(50),
                current_company VARCHAR(255),
                current_role VARCHAR(255),
                total_years INTEGER,
                current_ctc DECIMAL(10, 2),
                expected_ctc DECIMAL(10, 2),
                notice_period INTEGER,
                location VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS applications (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id),
                job_id INTEGER,
                company VARCHAR(255) NOT NULL,
                role VARCHAR(255) NOT NULL,
                location VARCHAR(255),
                job_url TEXT,
                status VARCHAR(50) DEFAULT 'Applied',
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                notes TEXT
            );

            CREATE TABLE IF NOT EXISTS jobs (
                id SERIAL PRIMARY KEY,
                title VARCHAR(500) NOT NULL,
                company VARCHAR(255) NOT NULL,
                location VARCHAR(255),
                description TEXT,
                requirements TEXT,
                salary_min DECIMAL(10, 2),
                salary_max DECIMAL(10, 2),
                experience_min INTEGER,
                experience_max INTEGER,
                job_type VARCHAR(50),
                source VARCHAR(100),
                source_url TEXT UNIQUE,
                posted_date TIMESTAMP,
                scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT true
            );

            CREATE TABLE IF NOT EXISTS resumes (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id),
                user_name VARCHAR(255),
                user_email VARCHAR(255),
                content TEXT NOT NULL,
                original_filename VARCHAR(500),
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS resume_versions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id),
                job_id INTEGER REFERENCES jobs(id),
                content TEXT NOT NULL,
                pdf_path TEXT,
                ats_score DECIMAL(5, 2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS chat_history (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id),
                role VARCHAR(50) NOT NULL,
                message TEXT NOT NULL,
                folder VARCHAR(100) DEFAULT 'All',
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
            CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
            CREATE INDEX IF NOT EXISTS idx_jobs_is_active ON jobs(is_active);
            CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company);
            CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
            CREATE INDEX IF NOT EXISTS idx_chat_user_id ON chat_history(user_id);
        `;

        const statements = schema.split(';').filter(s => s.trim());
        for (const stmt of statements) {
            if (stmt.trim()) {
                await this.query(stmt);
            }
        }

        console.log('PostgreSQL schema initialized successfully');
    }

    // Get user by ID with error handling
    async getUserById(userId) {
        try {
            const result = await this.safeQuery(
                'SELECT * FROM users WHERE id = ?',
                [userId]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error getting user:', error);
            return null;
        }
    }

    // Create application with validation
    async createApplication(userId, jobData) {
        const { job_id, company, role, location, job_url, status = 'Applied' } = jobData;

        const result = await this.safeQuery(`
            INSERT INTO applications (user_id, job_id, company, role, location, job_url, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [userId, job_id, company, role, location, job_url, status]);

        return result.lastInsertRowid;
    }

    // Get applications for user
    async getUserApplications(userId) {
        const result = await this.safeQuery(
            'SELECT * FROM applications WHERE user_id = ? ORDER BY applied_at DESC',
            [userId]
        );
        return result.rows;
    }

    // Search jobs with filters
    async searchJobs(filters = {}) {
        let sql = 'SELECT * FROM jobs WHERE is_active = ?';
        let params = [1];

        if (filters.title) {
            sql += ' AND title LIKE?';
            params.push(`%${filters.title}%`);
        }

        if (filters.location) {
            sql += ' AND location LIKE ?';
            params.push(`%${filters.location}%`);
        }

        if (filters.company) {
            sql += ' AND company LIKE ?';
            params.push(`%${filters.company}%`);
        }

        sql += ' ORDER BY scraped_at DESC LIMIT ?';
        params.push(filters.limit || 50);

        const result = await this.safeQuery(sql, params);
        return result.rows;
    }

    // Get latest resume
    async getLatestResume(userId) {
        const result = await this.safeQuery(
            'SELECT * FROM resumes WHERE user_id = ? ORDER BY uploaded_at DESC LIMIT 1',
            [userId]
        );
        return result.rows[0] || null;
    }

    // Close connection
    async close() {
        if (this.dbType === 'postgres') {
            await this.pool.end();
        } else {
            this.db.close();
        }
    }
}

module.exports = DatabaseManager;
