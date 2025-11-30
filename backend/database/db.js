const { Pool } = require('pg');

/**
 * Production Database Manager - PostgreSQL Only
 */
class DatabaseManager {
    constructor() {
        this.initPostgres();
    }

    initPostgres() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.DATABASE_SSL === 'require' ? {
                rejectUnauthorized: false
            } : false,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });

        this.pool.on('error', (err) => {
            console.error('Unexpected PostgreSQL error', err);
        });

        // Auto-initialize schema
        // Avoid initializing schema in tests or if not needed immediately
        if (process.env.NODE_ENV !== 'test') {
            this.initializePostgresSchema().then(() => {
                console.log('✅ PostgreSQL connection pool & schema initialized');
            }).catch(err => {
                console.error('❌ Schema initialization failed:', err);
            });
        }
    }

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
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                subscription_tier VARCHAR(50) DEFAULT 'free',
                profile_data TEXT
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
                await this.query(stmt);
            } catch (err) {
                console.warn(`Warning executing schema statement: ${stmt.substring(0, 50)}...`, err.message);
            }
        }
    }

    async query(sql, params = []) {
        try {
            const result = await this.pool.query(sql, params);
            return {
                rows: result.rows,
                rowCount: result.rowCount,
                lastInsertRowid: result.rows[0]?.id
            };
        } catch (error) {
            console.error('Database query error:', error);
            console.error('Query:', sql);
            console.error('Params:', params);
            throw error;
        }
    }

    async safeQuery(sql, params = []) {
        // Wrapper for query to maintain backward compatibility
        // The previous check for '${' or '+' was too aggressive and could block valid SQL or comments.
        // We rely on parameterized queries (params array) for security.
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
        let params = [true];
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

    async close() {
        await this.pool.end();
    }
}

module.exports = DatabaseManager;

