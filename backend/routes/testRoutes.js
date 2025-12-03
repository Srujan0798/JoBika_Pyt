const express = require('express');
const router = express.Router();
const db = require('../database/db');
const crypto = require('crypto');

// Test endpoint to verify database write capability
router.post('/test-db-write', async (req, res) => {
    try {
        const testId = crypto.randomUUID();
        const testJob = {
            id: testId,
            title: 'Test Job ' + Date.now(),
            company: 'Test Company',
            location: 'Test Location',
            source: 'test',
            external_link: 'https://test.com/' + testId,
            experience_min: 1,
            experience_max: 3,
            salary_min: 500000,
            salary_max: 800000,
            skills_required: JSON.stringify(['Test Skill']),
            posted_date: new Date().toISOString(),
            description: 'Test job description',
            is_active: 1
        };

        console.log('🧪 Testing database write with job:', testJob.title);

        // Try to insert
        const insertResult = await db.query(`
            INSERT INTO jobs (
                id, title, company, location, source,
                external_link, experience_min, experience_max,
                salary_min, salary_max, skills_required, posted_date,
                description, is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        `, [
            testJob.id,
            testJob.title,
            testJob.company,
            testJob.location,
            testJob.source,
            testJob.external_link,
            testJob.experience_min,
            testJob.experience_max,
            testJob.salary_min,
            testJob.salary_max,
            testJob.skills_required,
            testJob.posted_date,
            testJob.description,
            testJob.is_active
        ]);

        console.log('✅ Insert result:', insertResult);

        // Try to read it back
        const selectResult = await db.query('SELECT * FROM jobs WHERE id = $1', [testId]);
        const foundJob = selectResult.rows ? selectResult.rows[0] : selectResult[0];

        console.log('🔍 Select result:', foundJob ? 'Found' : 'Not found');

        res.json({
            success: true,
            inserted: !!insertResult,
            found: !!foundJob,
            job: foundJob,
            message: foundJob ? 'Database write successful!' : 'Database write failed - job not found after insert'
        });
    } catch (error) {
        console.error('❌ Test DB write error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
});

// Test endpoint to count jobs
router.get('/test-count-jobs', async (req, res) => {
    try {
        const result = await db.query('SELECT COUNT(*) as count FROM jobs');
        const count = result.rows ? result.rows[0].count : result[0].count;

        res.json({
            success: true,
            count: count,
            message: `Found ${count} jobs in database`
        });
    } catch (error) {
        console.error('❌ Test count error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/test/migrate - Run schema migrations
router.post('/migrate', async (req, res) => {
    try {
        console.log('Running migrations...');

        // Add file_data to resumes
        try {
            await db.query('ALTER TABLE resumes ADD COLUMN IF NOT EXISTS file_data BYTEA');
            console.log('Added file_data to resumes');
        } catch (e) {
            console.log('Error adding file_data to resumes (might exist):', e.message);
        }

        // Add file_data to resume_versions
        try {
            await db.query('ALTER TABLE resume_versions ADD COLUMN IF NOT EXISTS file_data BYTEA');
            console.log('Added file_data to resume_versions');
        } catch (e) {
            console.log('Error adding file_data to resume_versions (might exist):', e.message);
        }

        // Add created_at to applications
        try {
            await db.query('ALTER TABLE applications ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
            console.log('Added created_at to applications');
        } catch (e) {
            console.log('Error adding created_at to applications (might exist):', e.message);
        }

        res.json({ success: true, message: 'Migrations completed' });
    } catch (error) {
        console.error('Migration error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
