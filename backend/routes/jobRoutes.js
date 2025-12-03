const express = require('express'); // Force redeploy
const router = express.Router();
const db = require('../database/db');
const authMiddleware = require('../middleware/auth');
const cache = require('../utils/CacheService');

// GET /api/jobs - Search jobs
router.get('/', async (req, res) => {
    console.log('🔍 GET /api/jobs hit');
    console.log('📋 Query params:', req.query);
    try {
        const { q, location, minSalary, maxSalary, experience } = req.query;
        const cacheKey = `jobs_${JSON.stringify(req.query)}`;
        console.log('🔑 Cache key:', cacheKey);

        // Check cache first
        const cachedJobs = await cache.get(cacheKey);
        if (cachedJobs) {
            console.log('✅ Returning cached jobs:', Array.isArray(cachedJobs) ? cachedJobs.length : 'NOT ARRAY');
            return res.json(cachedJobs);
        }
        console.log('❌ No cache found, querying database...');

        let query = 'SELECT * FROM jobs WHERE is_active = $1';
        const params = [1]; // is_active = 1 (true)
        let paramIndex = 2;

        if (q) {
            query += ` AND (title ILIKE $${paramIndex} OR company ILIKE $${paramIndex + 1} OR skills_required ILIKE $${paramIndex + 2})`;
            const term = `%${q}%`;
            params.push(term, term, term);
            paramIndex += 3;
        }

        if (location) {
            query += ` AND location ILIKE $${paramIndex}`;
            params.push(`%${location}%`);
            paramIndex++;
        }

        query += ' ORDER BY posted_date DESC LIMIT 50';


        console.log('📝 Executing query:', query);
        console.log('📊 With params:', params);
        const result = await db.query(query, params);
        console.log('🔍 Query result type:', typeof result);
        console.log('🔍 Query result keys:', Object.keys(result || {}));
        console.log('🔍 result.rows type:', typeof result.rows);
        console.log('🔍 result.rows:', result.rows);
        let jobs = result.rows || result;
        console.log('📦 Jobs after extraction:', typeof jobs, Array.isArray(jobs) ? `Array[${jobs.length}]` : 'NOT ARRAY');

        // Ensure jobs is an array
        if (!Array.isArray(jobs)) {
            console.error('⚠️ Jobs is not an array:', typeof jobs, jobs);
            jobs = [];
        }

        console.log(`✅ Found ${jobs.length} jobs`);

        // Cache the raw result before personalization
        await cache.set(cacheKey, jobs);

        // Smart Sort: Calculate match scores if user is logged in
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                // Verify token and get user ID (simplified, ideally use middleware logic)
                const jwt = require('jsonwebtoken');
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');

                // Fetch full user profile for matching
                const userRes = await db.query('SELECT * FROM users WHERE id = $1', [decoded.userId || decoded.id]);
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

        console.log(`Returning ${jobs.length} jobs to client`);
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

// POST /api/jobs/scrape - Trigger scraper (Admin/Dev only)
router.post('/scrape', async (req, res) => {
    try {
        const JobScraper = require('../services/JobScraper');
        const scraper = new JobScraper();
        const count = await scraper.run();
        res.json({ success: true, message: `Scraped/Generated ${count} jobs` });
    } catch (error) {
        console.error('Scrape error:', error);
        res.status(500).json({ error: 'Scrape failed' });
    }
});

module.exports = router;
