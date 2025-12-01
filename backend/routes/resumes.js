const express = require('express');
const router = express.Router();
const db = require('../database/db');
const authMiddleware = require('../middleware/auth');
const ResumeTailoringService = require('../services/ResumeTailoringService');
const path = require('path');
const fs = require('fs');

// Initialize service
const tailoringService = new ResumeTailoringService(process.env.GEMINI_API_KEY);

// GET /api/resumes - List all tailored resume versions
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const result = await db.query(`
            SELECT rv.id, rv.created_at, rv.pdf_url, j.title as job_title, j.company 
            FROM resume_versions rv
            LEFT JOIN jobs j ON rv.job_id = j.id
            WHERE rv.user_id = ?
            ORDER BY rv.created_at DESC
        `, [userId]);

        res.json(result.rows || result);
    } catch (error) {
        console.error('Error fetching resumes:', error);
        res.status(500).json({ error: 'Failed to fetch resumes' });
    }
});

// POST /api/resumes/tailor - Tailor resume for a specific job
router.post('/tailor', authMiddleware, async (req, res) => {
    try {
        const { resumeId, jobId, jobDescription } = req.body;
        const userId = req.user.userId || req.user.id; // Handle both formats

        if (!resumeId || (!jobId && !jobDescription)) {
            return res.status(400).json({ error: 'Missing required fields: resumeId and (jobId or jobDescription)' });
        }

        // 1. Fetch User's Resume
        // If resumeId is 'latest', fetch the most recent one
        let resume;
        if (resumeId === 'latest') {
            const resumeRes = await db.query('SELECT * FROM resumes WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [userId]);
            resume = resumeRes.rows ? resumeRes.rows[0] : resumeRes[0];
        } else {
            const resumeRes = await db.query('SELECT * FROM resumes WHERE id = ? AND user_id = ?', [resumeId, userId]);
            resume = resumeRes.rows ? resumeRes.rows[0] : resumeRes[0];
        }

        if (!resume) {
            return res.status(404).json({ error: 'Resume not found' });
        }

        // Parse resume data if it's stored as string
        const resumeData = typeof resume.parsed_data === 'string' ? JSON.parse(resume.parsed_data) : resume.parsed_data;

        // 2. Fetch Job Details
        let jobDetails = { title: 'Target Role', company: 'Target Company', location: 'India' };
        let jdText = jobDescription;

        if (jobId) {
            const jobRes = await db.query('SELECT * FROM jobs WHERE id = ?', [jobId]);
            const job = jobRes.rows ? jobRes.rows[0] : jobRes[0];
            if (job) {
                jobDetails = {
                    id: job.id,
                    title: job.title,
                    company: job.company,
                    location: job.location
                };
                // Use job description from DB if not provided explicitly
                if (!jdText) {
                    jdText = job.description || `${job.title} at ${job.company}. Skills: ${job.skills_required}`;
                }
            }
        }

        // 3. Tailor Resume
        console.log(`Tailoring resume for user ${userId} and job ${jobDetails.title}...`);
        const tailoredResume = await tailoringService.tailorResumeForJob(resumeData, jdText, jobDetails);

        // 4. Generate PDF
        const fileName = `tailored_${userId}_${Date.now()}.pdf`;
        const publicDir = path.join(__dirname, '../../frontend-next/public/resumes'); // Adjust path as needed
        // Ensure directory exists
        if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir, { recursive: true });
        }
        const filePath = path.join(publicDir, fileName);

        await tailoringService.generateResumePDF(tailoredResume, filePath);

        // 5. Save Version to DB
        const versionId = require('crypto').randomUUID();
        await db.query(`
            INSERT INTO resume_versions (id, user_id, job_id, content, pdf_url)
            VALUES (?, ?, ?, ?, ?)
        `, [
            versionId,
            userId,
            jobId || null,
            JSON.stringify(tailoredResume),
            `/resumes/${fileName}`
        ]);

        res.json({
            success: true,
            tailoredResume,
            pdfUrl: `/resumes/${fileName}`,
            versionId
        });

    } catch (error) {
        console.error('Error tailoring resume:', error);
        res.status(500).json({ error: 'Failed to tailor resume' });
    }
});

module.exports = router;
