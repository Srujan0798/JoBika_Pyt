const express = require('express'); // Force redeploy
const router = express.Router();
const db = require('../database/db');
const authMiddleware = require('../middleware/auth');
const cache = require('../utils/CacheService');

// GET /api/jobs - Search jobs
router.get('/', async (req, res) => {
    console.log('GET /api/jobs hit');
    try {
        const { q, location, minSalary, maxSalary, experience } = req.query;
        const cacheKey = `jobs_${JSON.stringify(req.query)}`;

        // Check cache first
        const cachedJobs = cache.get(cacheKey);
        if (cachedJobs) {
            console.log('Returning cached jobs');
            return res.json(cachedJobs);
        }

        let query = 'SELECT * FROM jobs WHERE is_active = 1';
        const params = [];

        if (q) {
            query += ` AND (title LIKE ? OR company LIKE ? OR skills_required LIKE ?)`;
            const term = `%${q}%`;
            params.push(term, term, term);
        }

        if (location) {
            query += ` AND location LIKE ?`;
            params.push(`%${location}%`);
        }

        query += ' ORDER BY posted_date DESC LIMIT 50';

        const result = await db.query(query, params);
        let jobs = result.rows || result;

        // Cache the raw result before personalization
        cache.set(cacheKey, jobs);

        // Smart Sort: Calculate match scores if user is logged in
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                // Verify token and get user ID (simplified, ideally use middleware logic)
                const jwt = require('jsonwebtoken');
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');

                // Fetch full user profile for matching
                const userRes = await db.query('SELECT * FROM users WHERE id = ?', [decoded.userId || decoded.id]);
                const user = userRes.rows ? userRes.rows[0] : userRes[0];

                if (user) {
                    // Normalize user profile for MatchingEngine
                    const userProfile = {
                        skills: user.skills ? JSON.parse(user.skills) : [],
                        totalYears: user.total_years || 0,
                        location: user.location || '',
                        expectedCtc: user.expected_ctc || 0
                    };

                    // Calculate scores
                    jobs = jobs.map(job => {
                        const score = matchingEngine.calculateScore(userProfile, job);
                        return { ...job, match_score: score };
                    });

                    // Sort by score descending
                    jobs.sort((a, b) => b.match_score - a.match_score);
                } else {
                    // User not found in DB
                }
            } catch (e) {
                console.warn('Token verification failed during smart sort:', e.message);
                // Continue without sorting if token is invalid
            }
        } else {
            // No auth header
        }

        res.json(jobs);
    } catch (error) {
        console.error('Error searching jobs:', error);
        res.status(500).json({ error: 'Failed to fetch jobs' });
    }
});

// GET /api/jobs/:id - Job details
router.get('/:id', async (req, res) => {
    try {
        const cacheKey = `job_${req.params.id}`;
        const cachedJob = await cache.get(cacheKey);
        if (cachedJob) {
            return res.json(cachedJob);
        }

        const result = await db.query('SELECT * FROM jobs WHERE id = ?', [req.params.id]);
        const job = result.rows ? result.rows[0] : result[0];

        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        await cache.set(cacheKey, job, 600); // Cache for 10 minutes
        res.json(job);
    } catch (error) {
        console.error('Error fetching job:', error);
        res.status(500).json({ error: 'Failed to fetch job' });
    }
});

const matchingEngine = require('../services/MatchingEngine');

// ... existing routes ...

// POST /api/jobs/match - Calculate match score
router.post('/match', async (req, res) => {
    try {
        const { userProfile, job } = req.body;
        if (!userProfile || !job) {
            return res.status(400).json({ error: 'Missing userProfile or job data' });
        }

        const score = matchingEngine.calculateScore(userProfile, job);
        res.json({ score });
    } catch (error) {
        console.error('Error calculating match:', error);
        res.status(500).json({ error: 'Failed to calculate match' });
    }
});

module.exports = router;
