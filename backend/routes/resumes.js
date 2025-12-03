const express = require('express');
const router = express.Router();
const db = require('../database/db');
const authMiddleware = require('../middleware/auth');
const ResumeTailoringService = require('../services/ResumeTailoringService');
const ResumeAnalysisService = require('../services/ResumeAnalysisService');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const pdfParse = require('pdf-parse');

// Configure Multer for memory storage (files stored as Buffer)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed!'), false);
        }
    }
});

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
            WHERE rv.user_id = $1
            ORDER BY rv.created_at DESC
        `, [userId]);

        // Transform pdf_url to download endpoint if it's a local path
        const rows = result.rows || result;
        const transformed = rows.map(row => ({
            ...row,
            pdf_url: `/api/resumes/${row.id}/download` // Use download endpoint
        }));

        res.json(transformed);
    } catch (error) {
        console.error('Error fetching resumes:', error);
        res.status(500).json({ error: 'Failed to fetch resumes' });
    }
});

// POST /api/resumes/upload - Upload and Parse Resume
router.post('/upload', authMiddleware, upload.single('resume'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const userId = req.user.userId || req.user.id;
        const fileBuffer = req.file.buffer;

        // 1. Parse PDF Text
        let parsedText = '';
        try {
            const pdfData = await pdfParse(fileBuffer);
            parsedText = pdfData.text;
        } catch (parseError) {
            console.warn('PDF parsing failed:', parseError.message);
            parsedText = 'Could not extract text from PDF.';
        }

        // 2. Extract basic info (Mock extraction for now, or use AI)
        // Ideally, we would use Gemini here to extract structured JSON from text
        const parsedData = {
            raw_text: parsedText,
            fileName: req.file.originalname
        };

        // 3. Save to Database (Store Buffer directly)
        const resumeId = require('crypto').randomUUID();
        await db.query(`
            INSERT INTO resumes (id, user_id, original_url, file_data, parsed_data)
            VALUES ($1, $2, $3, $4, $5)
        `, [
            resumeId,
            userId,
            'stored_in_db', // Placeholder
            fileBuffer,     // Binary Data
            JSON.stringify(parsedData)
        ]);

        res.json({
            success: true,
            message: 'Resume uploaded and parsed successfully',
            resumeId
        });

    } catch (error) {
        console.error('Resume upload error:', error);
        res.status(500).json({ error: error.message || 'Failed to upload resume' });
    }
});

// GET /api/resumes/:id/download - Download Resume PDF
router.get('/:id/download', async (req, res) => {
    try {
        const { id } = req.params;

        // Check resume_versions first
        let result = await db.query('SELECT file_data FROM resume_versions WHERE id = $1', [id]);
        let row = result.rows ? result.rows[0] : result.rows[0];

        // If not found, check original resumes
        if (!row) {
            result = await db.query('SELECT file_data FROM resumes WHERE id = $1', [id]);
            row = result.rows ? result.rows[0] : result.rows[0];
        }

        if (!row || !row.file_data) {
            return res.status(404).json({ error: 'File not found' });
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="resume_${id}.pdf"`);
        res.send(row.file_data);

    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Failed to download file' });
    }
});

// POST /api/resumes/tailor - Tailor resume for a specific job
router.post('/tailor', authMiddleware, async (req, res) => {
    try {
        const { resumeId, jobId, jobDescription } = req.body;
        const userId = req.user.userId || req.user.id;

        if (!resumeId || (!jobId && !jobDescription)) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // 1. Fetch User's Resume
        let resume;
        if (resumeId === 'latest') {
            const resumeRes = await db.query('SELECT * FROM resumes WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', [userId]);
            resume = resumeRes.rows ? resumeRes.rows[0] : resumeRes[0];
        } else {
            const resumeRes = await db.query('SELECT * FROM resumes WHERE id = $1 AND user_id = $2', [resumeId, userId]);
            resume = resumeRes.rows ? resumeRes.rows[0] : resumeRes[0];
        }

        if (!resume) {
            return res.status(404).json({ error: 'Resume not found' });
        }

        // Parse resume data
        const resumeData = typeof resume.parsed_data === 'string' ? JSON.parse(resume.parsed_data) : resume.parsed_data;

        // 2. Fetch Job Details
        let jobDetails = { title: 'Target Role', company: 'Target Company', location: 'India' };
        let jdText = jobDescription;

        if (jobId) {
            const jobRes = await db.query('SELECT * FROM jobs WHERE id = $1', [jobId]);
            const job = jobRes.rows ? jobRes.rows[0] : jobRes[0];
            if (job) {
                jobDetails = {
                    id: job.id,
                    title: job.title,
                    company: job.company,
                    location: job.location
                };
                if (!jdText) {
                    jdText = job.description || `${job.title} at ${job.company}`;
                }
            }
        }

        // 3. Tailor Resume
        console.log(`Tailoring resume for user ${userId}...`);
        const tailoredResume = await tailoringService.tailorResumeForJob(resumeData, jdText, jobDetails);

        // 4. Generate PDF (Get Buffer)
        const pdfBuffer = await tailoringService.generateResumePDF(tailoredResume);

        // 5. Save Version to DB
        const versionId = require('crypto').randomUUID();
        await db.query(`
            INSERT INTO resume_versions (id, user_id, job_id, content, pdf_url, file_data)
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [
            versionId,
            userId,
            jobId || null,
            JSON.stringify(tailoredResume),
            `/api/resumes/${versionId}/download`, // Point to download endpoint
            pdfBuffer
        ]);

        res.json({
            success: true,
            tailoredResume,
            pdfUrl: `/api/resumes/${versionId}/download`,
            versionId
        });

    } catch (error) {
        console.error('Error tailoring resume:', error);
        res.status(500).json({ error: 'Failed to tailor resume' });
    }
});

// POST /api/resumes/analyze/:id - Analyze a resume
router.post('/analyze/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId || req.user.id;

        // 1. Fetch Resume
        const result = await db.query('SELECT * FROM resumes WHERE id = $1 AND user_id = $2', [id, userId]);
        const resume = result.rows ? result.rows[0] : result[0];

        if (!resume) {
            return res.status(404).json({ error: 'Resume not found' });
        }

        // 2. Extract Text
        let resumeText = '';
        if (resume.parsed_data) {
            const parsed = typeof resume.parsed_data === 'string' ? JSON.parse(resume.parsed_data) : resume.parsed_data;
            resumeText = parsed.raw_text || '';
        }

        // Fallback: If no text, try to parse file_data on the fly (if pdf-parse is available)
        if (!resumeText && resume.file_data) {
            try {
                const pdfData = await pdfParse(resume.file_data);
                resumeText = pdfData.text;
            } catch (e) {
                console.warn('Failed to parse PDF on the fly:', e);
            }
        }

        if (!resumeText) {
            return res.status(400).json({ error: 'Could not extract text from resume' });
        }

        // 3. Analyze
        console.log(`Analyzing resume ${id} for user ${userId}...`);
        const analysis = await ResumeAnalysisService.analyzeResume(resumeText);

        res.json({
            success: true,
            analysis
        });

    } catch (error) {
        console.error('Resume analysis error:', error);
        res.status(500).json({ error: 'Failed to analyze resume' });
    }
});

module.exports = router;
