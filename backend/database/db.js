const dns = require('dns');
// CRITICAL: Force IPv4 BEFORE any database connections
dns.setDefaultResultOrder('ipv4first');

const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

/**
 * Database Manager - Supports PostgreSQL with SQLite Fallback
 */
class DatabaseManager {
    constructor() {
        this.dbType = 'postgres'; // Default to postgres
        this.pool = null;
        this.sqliteDb = null;
        this.initDatabase();
    }

    async initDatabase() {
        // Try initializing PostgreSQL first
        if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
            try {
                console.log('🔄 Attempting to connect to PostgreSQL...');
                this.initPostgres();
                // Test connection
                await this.pool.query('SELECT 1');
                console.log('✅ PostgreSQL connected successfully');

                // Initialize Postgres Schema
                await this.initializePostgresSchema();
                return;
            } catch (err) {
                console.error('❌ PostgreSQL connection failed:', err.message);
                console.log('⚠️ Switching to SQLite fallback...');
                this.dbType = 'sqlite';
            }
        } else {
            console.log('⚠️ No valid DATABASE_URL found. Using SQLite fallback.');
            this.dbType = 'sqlite';
        }

        // Initialize SQLite if Postgres failed or wasn't configured
        if (this.dbType === 'sqlite') {
            this.initSqlite();
        }
    }

    initPostgres() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? {
                rejectUnauthorized: false
            } : false,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000
        });

        this.pool.on('error', (err) => {
            console.error('Unexpected PostgreSQL error', err);
            // If runtime error occurs, we might want to switch to SQLite, 
            // but for now we just log it as the pool might recover.
        });
    }

    initSqlite() {
        const dbPath = path.resolve(__dirname, 'local.sqlite');
        console.log(`📂 Initializing SQLite database at: ${dbPath}`);

        this.sqliteDb = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('❌ SQLite initialization failed:', err.message);
            } else {
                console.log('✅ SQLite connected successfully');
                this.initializeSqliteSchema();
            }
        });
    }

    async initializePostgresSchema() {
        const schema = `
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT,
                name TEXT,
                phone TEXT,
                location TEXT,
                "current_role" TEXT,
                current_company TEXT,
                total_years REAL,
                current_ctc REAL,
                expected_ctc REAL,
                notice_period INTEGER,
                skills TEXT,
                preferences TEXT,
                subscription_tier TEXT DEFAULT 'free',
                credits INTEGER DEFAULT 10,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

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
                skills_required TEXT,
                source TEXT,
                external_link TEXT,
                posted_date TIMESTAMP,
                is_active INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS resumes (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                original_url TEXT,
                parsed_data TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS job_matches (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                job_id TEXT,
                match_score INTEGER,
                reasons TEXT,
                is_viewed INTEGER DEFAULT 0,
                is_saved INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY(job_id) REFERENCES jobs(id) ON DELETE CASCADE,
                UNIQUE(user_id, job_id)
            );

            CREATE TABLE IF NOT EXISTS applications (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                job_id TEXT,
                status TEXT DEFAULT 'applied',
                resume_version_id TEXT,
                cover_letter TEXT,
                notes TEXT,
                applied_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY(job_id) REFERENCES jobs(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS resume_versions (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                job_id TEXT,
                content TEXT,
                pdf_url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY(job_id) REFERENCES jobs(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS chat_history (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id),
                role VARCHAR(50) NOT NULL,
                message TEXT NOT NULL,
                folder VARCHAR(100) DEFAULT 'All',
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS saved_jobs (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id),
                job_id INTEGER NOT NULL REFERENCES jobs(id),
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, job_id)
            );

            CREATE TABLE IF NOT EXISTS job_alerts (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id),
                name VARCHAR(255) NOT NULL,
                keywords TEXT,
                locations TEXT,
                job_types TEXT,
                experience_min INTEGER,
                experience_max INTEGER,
                salary_min DECIMAL(10, 2),
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
            try {
                await this.pool.query(stmt);
            } catch (err) {
                console.warn(`Warning executing Postgres schema statement: ${stmt.substring(0, 50)}...`, err.message);
            }
        }
    }

    initializeSqliteSchema() {
        const schema = `
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT,
                name TEXT,
                phone TEXT,
                location TEXT,
                "current_role" TEXT,
                current_company TEXT,
                total_years REAL,
                current_ctc REAL,
                expected_ctc REAL,
                notice_period INTEGER,
                skills TEXT,
                preferences TEXT,
                subscription_tier TEXT DEFAULT 'free',
                credits INTEGER DEFAULT 10,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

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
                skills_required TEXT,
                source TEXT,
                external_link TEXT,
                posted_date TIMESTAMP,
                is_active INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS resumes (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                original_url TEXT,
                parsed_data TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS job_matches (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                job_id TEXT,
                match_score INTEGER,
                reasons TEXT,
                is_viewed INTEGER DEFAULT 0,
                is_saved INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY(job_id) REFERENCES jobs(id) ON DELETE CASCADE,
                UNIQUE(user_id, job_id)
            );

            CREATE TABLE IF NOT EXISTS applications (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                job_id TEXT,
                status TEXT DEFAULT 'applied',
                resume_version_id TEXT,
                cover_letter TEXT,
                notes TEXT,
                applied_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY(job_id) REFERENCES jobs(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS resume_versions (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                job_id TEXT,
                content TEXT,
                pdf_url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY(job_id) REFERENCES jobs(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS chat_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                role TEXT NOT NULL,
                message TEXT NOT NULL,
                folder TEXT DEFAULT 'All',
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id)
            );
            
            CREATE TABLE IF NOT EXISTS saved_jobs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                job_id INTEGER NOT NULL,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, job_id),
                FOREIGN KEY(user_id) REFERENCES users(id),
                FOREIGN KEY(job_id) REFERENCES jobs(id)
            );

            CREATE TABLE IF NOT EXISTS job_alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                keywords TEXT,
                locations TEXT,
                job_types TEXT,
                experience_min INTEGER,
                experience_max INTEGER,
                salary_min REAL,
                is_active INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id)
            );
        `;

        this.sqliteDb.serialize(() => {
            // Enable foreign keys
            this.sqliteDb.run("PRAGMA foreign_keys = ON");

            const statements = schema.split(';').filter(s => s.trim());
            for (const stmt of statements) {
                this.sqliteDb.run(stmt, (err) => {
                    if (err) {
                        console.warn(`Warning executing SQLite schema statement: ${stmt.substring(0, 50)}...`, err.message);
                    }
                });
            }
            console.log('✅ SQLite schema initialized');
        });
    }

    async query(sql, params = []) {
        if (this.dbType === 'postgres') {
            try {
                // Ensure params is an array
                const queryParams = Array.isArray(params) ? params : [];

                const result = await this.pool.query(sql, queryParams);
                return {
                    rows: result.rows,
                    rowCount: result.rowCount,
                    lastInsertRowid: result.rows[0]?.id
                };
            } catch (error) {
                console.error('PostgreSQL Query Error:', error.message);
                throw error;
            }
        } else {
            // SQLite Query Adapter
            return new Promise((resolve, reject) => {
                // Convert Postgres-style parameters ($1, $2) to SQLite style (?, ?)
                let sqliteSql = sql;
                let paramIndex = 1;
                // Basic replacement for $1, $2, etc.
                // Note: This simple replacement might fail if $1 is inside a string literal.
                // A more robust parser would be needed for complex cases, but this works for standard usage.
                while (sqliteSql.includes(`$${paramIndex}`)) {
                    // Use a regex to ensure we match $1 but not $11 (if we have < 10 params, simple replace works, but safer with regex)
                    // Actually, simple replace of `$${paramIndex}` is safe if we go in order and $1 doesn't match $10 prefix if we use regex boundaries,
                    // but `replace` only replaces the first occurrence unless global.
                    // The original code used `includes` check and `replace` (first only?).
                    // Let's use global replace.
                    const regex = new RegExp(`\\$${paramIndex}(?!\\d)`, 'g');
                    sqliteSql = sqliteSql.replace(regex, '?');
                    paramIndex++;
                }

                // Handle ILIKE (Postgres) -> LIKE (SQLite)
                sqliteSql = sqliteSql.replace(/ILIKE/gi, 'LIKE');

                // Handle RETURNING id (Postgres) -> Remove it for SQLite (we use this.lastID)
                const isInsert = /INSERT INTO/i.test(sqliteSql);
                if (isInsert) {
                    sqliteSql = sqliteSql.replace(/RETURNING id/gi, '');
                }

                if (isInsert) {
                    this.sqliteDb.run(sqliteSql, params, function (err) {
                        if (err) {
                            console.error('SQLite Query Error:', err.message);
                            reject(err);
                        } else {
                            resolve({
                                rows: [{ id: this.lastID }], // Mock RETURNING id behavior
                                rowCount: this.changes,
                                lastInsertRowid: this.lastID
                            });
                        }
                    });
                } else {
                    this.sqliteDb.all(sqliteSql, params, (err, rows) => {
                        if (err) {
                            console.error('SQLite Query Error:', err.message);
                            reject(err);
                        } else {
                            resolve({
                                rows: rows,
                                rowCount: rows.length
                            });
                        }
                    });
                }
            });
        }
    }

    async safeQuery(sql, params = []) {
        if (sql.includes('${') || sql.includes('+')) {
            throw new Error('SQL injection risk detected! Use parameterized queries.');
        }
        return this.query(sql, params);
    }

    async getUserById(userId) {
        try {
            const result = await this.safeQuery(
                'SELECT * FROM users WHERE id = $1',
                [userId]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error getting user:', error);
            return null;
        }
    }

    async getUserByEmail(email) {
        try {
            const result = await this.safeQuery(
                'SELECT * FROM users WHERE email = $1',
                [email]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error getting user by email:', error);
            return null;
        }
    }

    async createUser(userData) {
        const {
            email, passwordHash, name, phone, location,
            currentRole, currentCompany, totalYears,
            currentCtc, expectedCtc, noticePeriod, skills, preferences
        } = userData;

        try {
            // Handle array/object serialization for SQLite/Postgres compatibility
            const skillsValue = Array.isArray(skills) ? JSON.stringify(skills) : skills;
            const preferencesValue = typeof preferences === 'object' ? JSON.stringify(preferences) : preferences;
            const id = crypto.randomUUID();

            const result = await this.safeQuery(`
                INSERT INTO users (
                    id, email, password_hash, name, phone, location, 
                    current_role, current_company, total_years, 
                    current_ctc, expected_ctc, notice_period, 
                    skills, preferences
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                RETURNING id
            `, [
                id, email, passwordHash, name, phone, location,
                currentRole, currentCompany, totalYears,
                currentCtc, expectedCtc, noticePeriod,
                skillsValue, preferencesValue
            ]);

            // For SQLite, we return the generated UUID, not the ROWID
            return {
                id: id,
                ...userData
            };
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    async createApplication(userId, jobData) {
        const { job_id, company, role, location, job_url, status = 'Applied' } = jobData;

        const result = await this.safeQuery(`
            INSERT INTO applications (user_id, job_id, company, role, location, job_url, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id
        `, [userId, job_id, company, role, location, job_url, status]);

        return result.rows[0].id;
    }

    async getUserApplications(userId) {
        const result = await this.safeQuery(
            'SELECT * FROM applications WHERE user_id = $1 ORDER BY applied_at DESC',
            [userId]
        );
        return result.rows;
    }

    async searchJobs(filters = {}) {
        let sql = 'SELECT * FROM jobs WHERE is_active = $1';
        let params = [true]; // Postgres: true, SQLite: 1 (handled by driver usually, but let's be safe)

        if (this.dbType === 'sqlite') {
            params = [1];
        }

        let paramIndex = 2;

        if (filters.title) {
            sql += ` AND title ILIKE $${paramIndex}`;
            params.push(`%${filters.title}%`);
            paramIndex++;
        }

        if (filters.location) {
            sql += ` AND location ILIKE $${paramIndex}`;
            params.push(`%${filters.location}%`);
            paramIndex++;
        }

        if (filters.company) {
            sql += ` AND company ILIKE $${paramIndex}`;
            params.push(`%${filters.company}%`);
            paramIndex++;
        }

        sql += ` ORDER BY scraped_at DESC LIMIT $${paramIndex}`;
        params.push(filters.limit || 50);

        const result = await this.safeQuery(sql, params);
        return result.rows;
    }

    async getLatestResume(userId) {
        const result = await this.safeQuery(
            'SELECT * FROM resumes WHERE user_id = $1 ORDER BY uploaded_at DESC LIMIT 1',
            [userId]
        );
        return result.rows[0] || null;
    }

    async saveChatMessage(userId, role, message, folder = 'All') {
        try {
            await this.safeQuery(
                'INSERT INTO chat_history (user_id, role, message, folder) VALUES ($1, $2, $3, $4)',
                [userId, role, message, folder]
            );
        } catch (error) {
            console.error('Error saving chat message:', error);
            // Don't throw, just log. Chat should continue even if history fails.
        }
    }

    async getChatHistory(userId, folder = 'All', limit = 10) {
        try {
            const result = await this.safeQuery(
                'SELECT role, message, timestamp FROM chat_history WHERE user_id = $1 AND folder = $2 ORDER BY timestamp ASC LIMIT $3',
                [userId, folder, limit]
            );
            return result.rows;
        } catch (error) {
            console.error('Error fetching chat history:', error);
            return [];
        }
    }

    async close() {
        if (this.pool) await this.pool.end();
        if (this.sqliteDb) {
            this.sqliteDb.close((err) => {
                if (err) console.error('Error closing SQLite database:', err.message);
            });
        }
    }
}

// Export singleton instance
const dbInstance = new DatabaseManager();
module.exports = dbInstance;

