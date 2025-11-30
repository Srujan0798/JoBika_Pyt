const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { validate, alertSchema } = require('../middleware/validation');

// ============================================================
// DASHBOARD STATS ENDPOINT
// ============================================================

router.get('/users/dashboard-stats', async (req, res) => {
    try {
        const stats = {
            totalApplications: 0,
            inProgress: 0,
            interviews: 0,
            offers: 0,
            responseRate: 0,
            savedJobs: 0,
            applicationsByStatus: {},
            recentActivity: []
        };

        // Total applications
        const appCount = await db.query(
            'SELECT COUNT(*) as count FROM applications WHERE user_id = $1',
            [req.userId]
        );
        stats.totalApplications = appCount.rows[0]?.count || 0;

        // Applications by status
        const statusCounts = await db.query(`
            SELECT status, COUNT(*) as count
            FROM applications
            WHERE user_id = $1
            GROUP BY status
        `, [req.userId]);

        statusCounts.rows.forEach(row => {
            stats.applicationsByStatus[row.status] = row.count;

            if (['viewed', 'phone_screen', 'interview_scheduled'].includes(row.status)) {
                stats.inProgress += row.count;
            }
            if (row.status === 'interview_scheduled') {
                stats.interviews += row.count;
            }
            if (row.status === 'offer') {
                stats.offers += row.count;
            }
        });

        // Response rate
        const responded = await db.query(`
            SELECT COUNT(*) as count
            FROM applications
            WHERE user_id = $1 AND status != 'applied'
        `, [req.userId]);
        stats.responseRate = stats.totalApplications > 0
            ? Math.round((responded.rows[0]?.count / stats.totalApplications) * 100)
            : 0;

        // Saved jobs count
        const savedCount = await db.query(
            'SELECT COUNT(*) as count FROM saved_jobs WHERE user_id = $1',
            [req.userId]
        );
        stats.savedJobs = savedCount.rows[0]?.count || 0;

        // Recent activity
        const recent = await db.query(`
            SELECT * FROM application_events
            WHERE application_id IN (
                SELECT id FROM applications WHERE user_id = $1
            )
            ORDER BY created_at DESC
            LIMIT 10
        `, [req.userId]);
        stats.recentActivity = recent.rows;

        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// SAVED JOBS ENDPOINTS
// ============================================================

router.post('/saved-jobs', async (req, res) => {
    try {
        const { jobId } = req.body;
        await db.query(
            'INSERT INTO saved_jobs (user_id, job_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [req.userId, jobId]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/saved-jobs', async (req, res) => {
    try {
        const saved = await db.query(`
            SELECT j.*, s.created_at as saved_at, s.notes
            FROM saved_jobs s
            JOIN jobs j ON s.job_id = j.id
            WHERE s.user_id = $1
            ORDER BY s.created_at DESC
        `, [req.userId]);
        res.json(saved.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/saved-jobs/:jobId', async (req, res) => {
    try {
        await db.query(
            'DELETE FROM saved_jobs WHERE user_id = $1 AND job_id = $2',
            [req.userId, req.params.jobId]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// JOB ALERTS ENDPOINTS
// ============================================================

router.post('/alerts', validate(alertSchema), async (req, res) => {
    try {
        const { name, keywords, locations, jobTypes, experienceMin, experienceMax, salaryMin } = req.validated;

        const alertId = await db.query(`
            INSERT INTO job_alerts
            (user_id, name, keywords, locations, job_types, experience_min, experience_max, salary_min)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id
        `, [req.userId, name, keywords, locations, jobTypes, experienceMin, experienceMax, salaryMin]);

        res.json({ success: true, alertId: alertId.rows[0]?.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/alerts', async (req, res) => {
    try {
        const alerts = await db.query(
            'SELECT * FROM job_alerts WHERE user_id = $1 ORDER BY created_at DESC',
            [req.userId]
        );
        res.json(alerts.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/alerts/:id', async (req, res) => {
    try {
        const { isActive } = req.body;
        await db.query(
            'UPDATE job_alerts SET is_active = $1 WHERE id = $2 AND user_id = $3',
            [isActive, req.params.id, req.userId]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/alerts/:id', async (req, res) => {
    try {
        await db.query(
            'DELETE FROM job_alerts WHERE id = $1 AND user_id = $2',
            [req.params.id, req.userId]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
