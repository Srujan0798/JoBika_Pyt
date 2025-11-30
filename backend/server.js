require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Import utilities
const errorHandler = require('./utils/errorHandler');
const security = require('./middleware/security');
const authMiddleware = require('./middleware/auth');

// Import services
const db = require('./database/db');
const AuthService = require('./services/AuthService');
const OrionCoachService = require('./services/OrionCoachService');
const JobScraper = require('./services/JobScraper');
const ATSService = require('./services/ATSService');
const ResumeTailoringService = require('./services/ResumeTailoringService');
const ApplicationFormFiller = require('./services/ApplicationFormFiller');

const app = express();
// Enable trust proxy for Railway/Vercel
app.set('trust proxy', 1);
const port = process.env.PORT || 3000;

// Security Middleware (BEFORE other middleware)
app.use(security.securityHeaders());
app.use(security.xssProtection());
app.use(security.requestTimeout());
app.use(security.rateLimiter());

// CORS
app.use(cors(security.corsOptions()));

// Body Parser with limits
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Initialize services
// db is imported as singleton
const authService = new AuthService();
const orionService = new OrionCoachService(process.env.GEMINI_API_KEY);
const jobScraper = new JobScraper();
const atsService = new ATSService(process.env.GEMINI_API_KEY);
const resumeTailoring = new ResumeTailoringService(process.env.GEMINI_API_KEY);
const autoApply = new ApplicationFormFiller();

// Serve static files
app.use(express.static('../app'));

// Import resilience patterns
const { dbCircuitBreaker, apiRetry, gracefulDegradation } = require('./utils/resiliencePatterns');
const { validate, validateQuery, jobSearchSchema, chatMessageSchema, alertSchema } = require('./middleware/validation');

// Register graceful degradation fallbacks
gracefulDegradation.registerFallback('jobs', async () => {
    return { jobs: [], message: 'Job service temporarily unavailable' };
});

gracefulDegradation.registerFallback('chat', async () => {
    return { message: "I'm temporarily unavailable. Please try again.", isFallback: true };
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: db.dbType,
        gemini: process.env.GEMINI_API_KEY ? 'configured' : 'not_configured',
        uptime: process.uptime()
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    errorHandler.handleError(err, req, res);
});


// ====== AUTH ROUTES ======
app.use('/api/auth', require('./routes/auth'));

// ====== USER ROUTES ======
app.use('/api', authMiddleware, require('./routes/user'));

// ====== ORION AI CHAT ROUTES ======

app.post('/api/orion/chat', authMiddleware, async (req, res) => {
    try {
        const { message, folder } = req.body;

        // Save user message
        db.saveChatMessage(req.userId, 'user', message, folder || 'All');

        // Get chat history for context
        const history = db.getChatHistory(req.userId, folder, 10);

        // Get AI response
        const response = await orionService.chatWithOrion(message, history);

        // Save AI response
        db.saveChatMessage(req.userId, 'assistant', response, folder || 'All');

        res.json({ response, success: true });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({
            error: 'Chat service error',
            response: 'I apologize, but I\'m having trouble connecting right now. Please check if OpenAI API key is configured.'
        });
    }
});

app.get('/api/orion/history', authMiddleware, (req, res) => {
    try {
        const { folder, limit } = req.query;
        const history = db.getChatHistory(req.userId, folder, parseInt(limit) || 100);
        res.json({ history });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ====== ATS RESUME CHECKER ROUTES ======

app.post('/api/ats-check', authMiddleware, async (req, res) => {
    try {
        const { resumeText } = req.body;

        // Save resume
        const resumeResult = db.saveResume(req.userId, resumeText);

        // Analyze resume
        const analysis = await atsService.analyzeResume(resumeText);

        // Update with analysis
        db.updateResumeAnalysis(
            resumeResult.lastInsertRowid,
            analysis.score,
            analysis.keywords,
            analysis.suggestions
        );

        res.json({ analysis, success: true });
    } catch (error) {
        console.error('ATS check error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ====== ANALYTICS ROUTES ======

app.get('/api/analytics', authMiddleware, (req, res) => {
    try {
        const stats = db.getApplicationStats(req.userId);
        res.json({ stats });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ====== COVER LETTER GENERATION ======

app.post('/api/cover-letter', authMiddleware, async (req, res) => {
    try {
        const { userProfile, jobDescription, companyInfo } = req.body;

        // For now, use Orion to generate cover letter via chat
        const prompt = `Generate a professional cover letter for:
Company: ${companyInfo.name}
Role: ${jobDescription.title}
My Profile: ${JSON.stringify(userProfile)}

Job Description: ${jobDescription.full}`;

        const coverLetter = await orionService.chatWithOrion(prompt, []);
        res.json({ coverLetter, success: true });
    } catch (error) {
        console.error('Cover letter error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ====== INTERVIEW PREP ======

app.post('/api/interview-prep', authMiddleware, async (req, res) => {
    try {
        const { jobDescription, companyName, userProfile } = req.body;

        // For now, use Orion to generate interview prep
        const prompt = `Generate interview preparation for:
Company: ${companyName}
Role: ${jobDescription.title}
My Profile: ${JSON.stringify(userProfile)}

Provide:
1. Top 10 likely questions
2. STAR method examples
3. Company research points
4. Salary negotiation tips`;

        const prep = await orionService.chatWithOrion(prompt, []);
        res.json({ prep, success: true });
    } catch (error) {
        console.error('Interview prep error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ====== RESUME TAILORING (CORE FEATURE) ======

app.post('/api/tailor-resume', authMiddleware, async (req, res) => {
    try {
        const { resumeId, jobId } = req.body;

        // Get user's resume
        const resume = db.getLatestResume(req.userId);
        if (!resume) {
            return res.status(404).json({ error: 'No resume found. Please upload your resume first.' });
        }

        // Get job details
        const jobs = db.searchJobs({ jobId });
        if (!jobs || jobs.length === 0) {
            return res.status(404).json({ error: 'Job not found' });
        }
        const job = jobs[0];

        // Tailor resume for this specific job
        const tailoredResume = await resumeTailoring.tailorResumeForJob(
            JSON.parse(resume.content),
            job.description,
            {
                id: job.id,
                title: job.title,
                company: job.company,
                location: job.location
            }
        );

        // Generate PDF
        const pdfPath = `/tmp/resume_${req.userId}_${jobId}.pdf`;
        await resumeTailoring.generateResumePDF(
            { ...tailoredResume, name: resume.user_name, email: resume.user_email },
            pdfPath
        );

        // Save tailored version in database
        const versionResult = db.query(`
            INSERT INTO resume_versions (user_id, job_id, content, pdf_path, ats_score, created_at)
            VALUES ($1, $2, $3, $4, $5, NOW())
            RETURNING id
        `, [req.userId, jobId, JSON.stringify(tailoredResume), pdfPath, tailoredResume.atsScore]);

        res.json({
            success: true,
            tailoredResume,
            pdfPath,
            versionId: versionResult.lastInsertRowid,
            atsScore: tailoredResume.atsScore
        });
    } catch (error) {
        console.error('Resume tailoring error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ====== AUTO-APPLY (CORE FEATURE) ======

app.post('/api/auto-apply', authMiddleware, async (req, res) => {
    try {
        const { jobId, supervised = true } = req.body;

        // Get user data
        const user = db.getUserById(req.userId);

        // Get job
        const jobs = db.searchJobs({ jobId });
        if (!jobs || jobs.length === 0) {
            return res.status(404).json({ error: 'Job not found' });
        }
        const job = jobs[0];

        // Get or create tailored resume
        let tailoredResume = await getTailoredResumeForJob(req.userId, jobId);
        if (!tailoredResume) {
            // Create tailored resume first
            const resume = db.getLatestResume(req.userId);
            tailoredResume = await resumeTailoring.tailorResumeForJob(
                JSON.parse(resume.content),
                job.description,
                job
            );

            const pdfPath = `/tmp/resume_${req.userId}_${jobId}.pdf`;
            await resumeTailoring.generateResumePDF(
                { ...tailoredResume, name: user.name, email: user.email },
                pdfPath
            );
            tailoredResume.pdfPath = pdfPath;
        }

        // Auto-apply to job
        const result = await autoApply.autoApplyToJob(
            job.source_url || job.url,
            {
                fullName: user.name,
                email: user.email,
                phone: user.phone,
                currentCompany: user.current_company,
                currentRole: user.current_role,
                totalYears: user.total_years,
                currentCTC: user.current_ctc,
                expectedCTC: user.expected_ctc,
                noticePeriod: user.notice_period,
                location: user.location
            },
            tailoredResume,
            supervised
        );

        // Save application to database
        if (result.status === 'submitted' || result.status === 'awaiting_approval') {
            db.createApplication(req.userId, {
                job_id: jobId,
                company: job.company,
                role: job.title,
                location: job.location,
                job_url: job.source_url || job.url,
                status: result.status === 'submitted' ? 'Applied' : 'Draft'
            });
        }

        res.json({ success: true, result });
    } catch (error) {
        console.error('Auto-apply error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ====== BATCH AUTO-APPLY ======

app.post('/api/batch-auto-apply', authMiddleware, async (req, res) => {
    try {
        const { minMatchScore = 75, maxApplications = 20, supervised = false } = req.body;

        // Get high-match jobs for user
        const highMatchJobs = await db.query(`
            SELECT j.* FROM job_matches jm
            JOIN jobs j ON jm.job_id = j.id
            WHERE jm.user_id = $1
            AND jm.match_score >= $2
            AND jm.job_id NOT IN (
                SELECT job_id FROM applications WHERE user_id = $1
            )
            ORDER BY jm.match_score DESC
            LIMIT $3
        `, [req.userId, minMatchScore, maxApplications]);

        const jobIds = highMatchJobs.rows.map(j => j.id);

        // Batch apply
        const results = await autoApply.batchAutoApply(
            req.userId,
            jobIds,
            supervised,
            maxApplications
        );

        res.json({ success: true, results });
    } catch (error) {
        console.error('Batch auto-apply error:', error);
        res.status(500).json({ error: error.message });
    }
});

async function getTailoredResumeForJob(userId, jobId) {
    const result = await db.query(`
        SELECT * FROM resume_versions
        WHERE user_id = $1 AND job_id = $2
        ORDER BY created_at DESC
        LIMIT 1
    `, [userId, jobId]);

    if (result.rows && result.rows.length > 0) {
        return {
            ...JSON.parse(result.rows[0].content),
            pdfPath: result.rows[0].pdf_path
        };
    }
    return null;
}



// ============================================================
// SUBSCRIPTION & USAGE ENDPOINTS
// ============================================================

const { SubscriptionManager } = require('./middleware/subscription');

app.get('/api/subscription/status', authMiddleware, async (req, res) => {
    try {
        const stats = await SubscriptionManager.getUsageStats(req.user.id);
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/subscription/limits', authMiddleware, async (req, res) => {
    try {
        const user = await db.query('SELECT subscription_tier FROM users WHERE id = $1', [req.user.id]);
        const tier = user.rows[0]?.subscription_tier || 'free';
        const limits = SubscriptionManager.getLimits(tier);
        res.json(limits);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Use error handling middleware as the last middleware
app.use(errorHandler.errorMiddleware());

// Start server (Only if not running in test mode)
let server;
if (require.main === module) {
    server = app.listen(port, () => {
        console.log(`\n🚀 JoBika Backend Server Running`);
        console.log(`📍 Port: ${port}`);
        console.log(`💾 Database: ${db.dbPath}`);
        console.log(`🤖 Gemini AI: ${process.env.GEMINI_API_KEY ? '✅ Configured (FREE!)' : '❌ Not configured - Get FREE key: https://aistudio.google.com/app/apikey'}`);
        console.log(`\n✨ All systems ready!\n`);
    });
}

// Store server globally for graceful shutdown
global.server = server;

// Setup Graceful Shutdown
if (global.server) {
    global.server.on('close', async () => {
        console.log('Closing database connections...');
        await db.close();
    });
}

// Performance monitoring endpoint
app.post('/api/performance', (req, res) => {
    try {
        const metrics = req.body;
        console.log('Performance Metrics Received:', metrics);
        // In production, send to analytics service
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Error logging endpoint
app.post('/api/log-error', (req, res) => {
    try {
        const errorData = req.body;
        console.error('Frontend Error:', errorData);
        // In production, send to error tracking service (Sentry)
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = { app, server, db };

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...');
    db.close();
    process.exit(0);
});
