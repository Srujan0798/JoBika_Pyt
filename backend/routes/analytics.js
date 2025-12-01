const express = require('express');
const router = express.Router();
const db = require('../database/db');
const authMiddleware = require('../middleware/auth');

// GET /api/analytics/applications - Get all applications for Kanban board
router.get('/applications', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;

        // Fetch applications with job details
        // Note: This query joins applications with jobs to get company/title
        const query = `
            SELECT 
                a.id, a.status, a.applied_date, a.notes,
                j.title as job_title, j.company, j.location, j.salary_min, j.salary_max
            FROM applications a
            JOIN jobs j ON a.job_id = j.id
            WHERE a.user_id = ?
            ORDER BY a.applied_date DESC
        `;

        const result = await db.query(query, [userId]);
        const applications = result.rows || result;

        res.json(applications);
    } catch (error) {
        console.error('Error fetching applications:', error);
        res.status(500).json({ error: 'Failed to fetch applications' });
    }
});

// GET /api/analytics/stats - Get application counts by status
router.get('/stats', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;

        const query = `
            SELECT status, COUNT(*) as count
            FROM applications
            WHERE user_id = ?
            GROUP BY status
        `;

        const result = await db.query(query, [userId]);
        const stats = result.rows || result;

        // Format into a clean object
        const formattedStats = {
            applied: 0,
            interview: 0,
            offer: 0,
            rejected: 0,
            total: 0
        };

        stats.forEach(row => {
            const status = row.status.toLowerCase();
            if (formattedStats.hasOwnProperty(status)) {
                formattedStats[status] = row.count;
            }
            formattedStats.total += row.count;
        });

        res.json(formattedStats);
    } catch (error) {
        console.error('Error fetching analytics stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

module.exports = router;
