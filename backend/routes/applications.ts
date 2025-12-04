import express from 'express';
const router = express.Router();
import db from '../database/db';
import authMiddleware from '../middleware/auth';
import ApplicationFormFiller from '../services/ApplicationFormFiller';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// Initialize service
const formFiller = new ApplicationFormFiller();

// GET /api/applications - List user applications
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const result = await db.query(`
            SELECT a.*, j.title as job_title, j.company, j.location
            FROM applications a
            JOIN jobs j ON a.job_id = j.id
            WHERE a.user_id = $1
            ORDER BY a.created_at DESC
        `, [userId]);

        res.json(result.rows || result);
    } catch (error) {
        console.error('Error fetching applications:', error);
        res.status(500).json({ error: 'Failed to fetch applications: ' + error.message });
    }
});

// POST /api/applications/auto-apply - Auto-apply to a job
router.post('/auto-apply', authMiddleware, async (req, res) => {
    try {
        const { jobId, resumeVersionId, supervised = true } = req.body;
        const userId = req.user.userId || req.user.id;

        if (!jobId || !resumeVersionId) {
            return res.status(400).json({ error: 'Missing required fields: jobId, resumeVersionId' });
        }

        // 1. Fetch Job Details
        const jobRes = await db.query('SELECT * FROM jobs WHERE id = $1', [jobId]);
        const job = jobRes.rows ? jobRes.rows[0] : jobRes[0];

        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        if (!job.external_link) {
            return res.status(400).json({ error: 'Job does not have an external application link' });
        }

        // 2. Fetch User Profile
        const userRes = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
        const user = userRes.rows ? userRes.rows[0] : userRes[0];

        // 3. Fetch Resume Version (PDF Path)
        let resumeVersion;
        if (resumeVersionId === 'latest') {
            const resumeRes = await db.query('SELECT * FROM resume_versions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', [userId]);
            resumeVersion = resumeRes.rows ? resumeRes.rows[0] : resumeRes[0];
        } else {
            const resumeRes = await db.query('SELECT * FROM resume_versions WHERE id = $1', [resumeVersionId]);
            resumeVersion = resumeRes.rows ? resumeRes.rows[0] : resumeRes[0];
        }

        if (!resumeVersion) {
            // Fallback: Check if there's a main resume in 'resumes' table
            const mainResumeRes = await db.query('SELECT * FROM resumes WHERE user_id = $1 LIMIT 1', [userId]);
            const mainResume = mainResumeRes.rows ? mainResumeRes.rows[0] : mainResumeRes[0];

            if (mainResume) {
                // Mock a version object from main resume
                resumeVersion = {
                    id: mainResume.id,
                    pdf_url: mainResume.original_url || '/resumes/default.pdf', // Fallback
                    created_at: mainResume.created_at
                };
            } else {
                return res.status(404).json({ error: 'Resume version not found' });
            }
        }

        // Construct absolute path to PDF
        // Assuming pdf_url is like /resumes/filename.pdf and stored in frontend-next/public/resumes
        const pdfFileName = path.basename(resumeVersion.pdf_url || 'default.pdf');
        const pdfPath = path.resolve(__dirname, '../../frontend-next/public/resumes', pdfFileName);

        // Check if file exists, if not, warn but proceed with mock path for testing
        if (!fs.existsSync(pdfPath)) {
            console.warn(`⚠️ Resume PDF not found at ${pdfPath}. Using mock path.`);
            // return res.status(404).json({ error: 'Resume PDF file not found on server' });
        }

        // Prepare data for form filler
        const userData = {
            fullName: user.name,
            email: user.email,
            phone: user.phone,
            location: user.location,
            currentRole: user.current_role,
            currentCompany: user.current_company,
            totalYears: user.total_years,
            currentCTC: user.current_ctc,
            expectedCTC: user.expected_ctc,
            noticePeriod: user.notice_period,
            linkedinUrl: user.linkedin_url || '' // Add to DB if missing
        };

        const tailoredResume = {
            pdfPath: pdfPath
        };

        // 4. Trigger Auto-Apply
        console.log(`🚀 Starting auto-apply for user ${userId} to job ${jobId} (${job.external_link})`);

        // Run in background if not supervised? No, supervised needs immediate response with screenshot.
        // But Puppeteer can be slow. Set timeout high.

        const result = await formFiller.autoApplyToJob(job.external_link, userData, tailoredResume, supervised);

        // 5. Log Application Attempt
        const appId = crypto.randomUUID();
        await db.query(`
            INSERT INTO applications (id, user_id, job_id, status, resume_version_id, notes)
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [
            appId,
            userId,
            jobId,
            result.status === 'submitted' ? 'applied' : 'draft',
            resumeVersion.id,
            `Auto-apply attempt. Status: ${result.status}`
        ]);

        res.json({
            success: true,
            applicationId: appId,
            result: result
        });

    } catch (error) {
        console.error('Auto-apply API error:', error);
        res.status(500).json({
            error: 'Auto-apply failed: ' + error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

export default router;
