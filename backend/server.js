require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Import services
const DatabaseManager = require('./database/db');
const AuthService = require('./services/AuthService');
const OrionCoachService = require('./services/OrionCoachService');
const JobScraper = require('./services/JobScraper');
const ATSService = require('./services/ATSService');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('../app')); // Serve frontend files

// Initialize services
const db = new DatabaseManager();
const authService = new AuthService();
const orionService = new OrionCoachService(process.env.OPENAI_API_KEY);
const jobScraper = new JobScraper();
const atsService = new ATSService(process.env.OPENAI_API_KEY);

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        database: db.db ? 'connected' : 'disconnected',
        openai: process.env.OPENAI_API_KEY ? 'configured' : 'not configured'
    });
});

// ====== AUTHENTICATION ROUTES ======

app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, name, profileData } = req.body;
        const result = await authService.register(email, password, name, profileData);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await authService.login(email, password);
        res.json(result);
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
});

// ====== APPLICATION ROUTES ======

app.get('/api/applications', authService.authMiddleware.bind(authService), (req, res) => {
    try {
        const applications = db.getApplications(req.userId);
        res.json({ applications });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/applications', authService.authMiddleware.bind(authService), (req, res) => {
    try {
        const result = db.createApplication(req.userId, req.body);
        res.json({ success: true, applicationId: result.lastInsertRowid });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/applications/:id/status', authService.authMiddleware.bind(authService), (req, res) => {
    try {
        const { status } = req.body;
        db.updateApplicationStatus(req.params.id, status);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ====== JOB SCRAPER ROUTES ======

app.post('/api/scrape-jobs', async (req, res) => {
    try {
        const { role, location, limit } = req.body;

        console.log(`Scraping jobs for: ${role} in ${location}`);

        // Scrape jobs from LinkedIn
        const jobs = await jobScraper.scrapeLinkedIn(role, location, limit || 20);

        // Save jobs to database
        jobs.forEach(job => {
            try {
                db.saveJob({
                    ...job,
                    source: 'LinkedIn'
                });
            } catch (err) {
                console.error('Error saving job:', err);
            }
        });

        res.json({ jobs });
    } catch (error) {
        console.error('Job scraping error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/jobs', (req, res) => {
    try {
        const { title, location, company, limit } = req.query;
        const jobs = db.searchJobs({ title, location, company, limit: parseInt(limit) || 50 });
        res.json({ jobs });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ====== ORION AI CHAT ROUTES ======

app.post('/api/orion/chat', authService.authMiddleware.bind(authService), async (req, res) => {
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

app.get('/api/orion/history', authService.authMiddleware.bind(authService), (req, res) => {
    try {
        const { folder, limit } = req.query;
        const history = db.getChatHistory(req.userId, folder, parseInt(limit) || 100);
        res.json({ history });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ====== ATS RESUME CHECKER ROUTES ======

app.post('/api/ats-check', authService.authMiddleware.bind(authService), async (req, res) => {
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

app.get('/api/analytics', authService.authMiddleware.bind(authService), (req, res) => {
    try {
        const stats = db.getApplicationStats(req.userId);
        res.json({ stats });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ====== COVER LETTER GENERATION ======

app.post('/api/cover-letter', authService.authMiddleware.bind(authService), async (req, res) => {
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

app.post('/api/interview-prep', authService.authMiddleware.bind(authService), async (req, res) => {
    try {
        const { jobDescription, companyName, userProfile } = req.body;
        const prep = await aiServices.generateInterviewPrep(jobDescription, companyName, userProfile);
        res.json({ prep, success: true });
    } catch (error) {
        console.error('Interview prep error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(port, () => {
    console.log(`\n🚀 JoBika Backend Server Running`);
    console.log(`📍 Port: ${port}`);
    console.log(`💾 Database: ${db.dbPath}`);
    console.log(`🤖 OpenAI: ${process.env.OPENAI_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
    console.log(`\n✨ All systems ready!\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...');
    db.close();
    process.exit(0);
});
