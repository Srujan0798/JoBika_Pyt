const express = require('express');
const router = express.Router();
const db = require('../database/db');
const authMiddleware = require('../middleware/auth');
const ApplicationFormFiller = require('../services/ApplicationFormFiller');
const path = require('path');
const fs = require('fs');

// Initialize service
const formFiller = new ApplicationFormFiller();

// POST /api/applications/auto-apply - Auto-apply to a job
router.post('/auto-apply', authMiddleware, async (req, res) => {
    try {
        const { jobId, resumeVersionId, supervised = true } = req.body;
        const userId = req.user.userId || req.user.id;

        if (!jobId || !resumeVersionId) {
            return res.status(400).json({ error: 'Missing required fields: jobId, resumeVersionId' });
        }

        // 1. Fetch Job Details
        const jobRes = await db.query('SELECT * FROM jobs WHERE id = ?', [jobId]);
        const job = jobRes.rows ? jobRes.rows[0] : jobRes[0];

        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        if (!job.external_link) {
            return res.status(400).json({ error: 'Job does not have an external application link' });
        }

        // 2. Fetch User Profile
        const userRes = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
        const user = userRes.rows ? userRes.rows[0] : userRes[0];

        // 3. Fetch Resume Version (PDF Path)
        const resumeRes = await db.query('SELECT * FROM resume_versions WHERE id = ?', [resumeVersionId]);
        const resumeVersion = resumeRes.rows ? resumeRes.rows[0] : resumeRes[0];

        if (!resumeVersion) {
            return res.status(404).json({ error: 'Resume version not found' });
        }

        // Construct absolute path to PDF
        // Assuming pdf_url is like /resumes/filename.pdf and stored in frontend-next/public/resumes
        const pdfFileName = path.basename(resumeVersion.pdf_url);
        const pdfPath = path.resolve(__dirname, '../../frontend-next/public/resumes', pdfFileName);

        if (!fs.existsSync(pdfPath)) {
            return res.status(404).json({ error: 'Resume PDF file not found on server' });
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
        const appId = require('crypto').randomUUID();
        await db.query(`
            INSERT INTO applications (id, user_id, job_id, status, resume_version_id, notes)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            appId,
            userId,
            jobId,
            result.status === 'submitted' ? 'applied' : 'draft',
            resumeVersionId,
            `Auto-apply attempt. Status: ${result.status}`
        ]);

        res.json({
            success: true,
            applicationId: appId,
            result: result
        });

    } catch (error) {
        console.error('Auto-apply API error:', error);
        res.status(500).json({ error: 'Auto-apply failed: ' + error.message });
    }
});

module.exports = router;
