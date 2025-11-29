
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer'); // Keep this import as it was in the original
const ApplicationFormFiller = require('./services/ApplicationFormFiller');
const AIServices = require('./services/AIServices');
const JobScraper = require('./services/JobScraper');
const AnalyticsService = require('./services/AnalyticsService');
const NotificationService = require('./services/NotificationService');
const ReferralService = require('./services/ReferralService');
const PremiumService = require('./services/PremiumService');
const MonetizationService = require('./services/MonetizationService');
const SecurityService = require('./services/SecurityService');
const ATSService = require('./services/ATSService');
const CultureFitService = require('./services/CultureFitService');
const ComplianceService = require('./services/ComplianceService');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Initialize Services
const formFiller = new ApplicationFormFiller();
const aiServices = new AIServices(process.env.OPENAI_API_KEY);
const jobScraper = new JobScraper();
const analyticsService = new AnalyticsService();
const notificationService = new NotificationService();
const referralService = new ReferralService();
const atsService = new ATSService();
const cultureFitService = new CultureFitService();
const complianceService = new ComplianceService();
// Premium & Monetization are singletons
const premiumService = PremiumService;
const monetizationService = MonetizationService;
const securityService = SecurityService;

// --- Routes ---

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', services: ['smart-apply', 'cover-letter', 'interview-prep', 'scrape-jobs', 'analytics', 'notifications', 'community'] });
});

// 1. Smart Apply Endpoint
app.post('/api/smart-apply', async (req, res) => {
    try {
        const { jobUrl, userProfile, resumePath, supervised } = req.body;
        const result = await formFiller.fillApplication(jobUrl, userProfile, resumePath, supervised);
        res.json({ success: true, result });
    } catch (error) {
        console.error('Smart Apply Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 2. AI Cover Letter Endpoint
app.post('/api/generate-cover-letter', async (req, res) => {
    try {
        const { userProfile, jobDescription, companyInfo, variations } = req.body;
        const result = await aiServices.generateCoverLetter(userProfile, jobDescription, companyInfo, variations);
        res.json(result);
    } catch (error) {
        console.error('Cover Letter Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 3. AI Interview Prep Endpoint
app.post('/api/interview-prep', async (req, res) => {
    try {
        const { jobDescription, companyName, userProfile } = req.body;
        const result = await aiServices.generateInterviewPrep(jobDescription, companyName, userProfile);
        res.json(result);
    } catch (error) {
        console.error('Interview Prep Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 4. Job Scraping Endpoint
app.post('/api/scrape-jobs', async (req, res) => {
    try {
        const { source, query, location } = req.body;
        console.log('Scraping request: ' + source + ' for ' + query + ' in ' + location);

        const jobs = await jobScraper.searchJobs(source, query, location);
        res.json({ jobs, count: jobs.length });
    } catch (error) {
        console.error('Scraping Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 5. Analytics Endpoints
app.get('/api/analytics/insights', async (req, res) => {
    try {
        const userId = req.query.userId || 1; // Mock user ID
        const insights = await analyticsService.generateUserInsights(userId);
        res.json(insights);
    } catch (error) {
        console.error('Analytics Error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/analytics/event', async (req, res) => {
    try {
        const eventData = req.body;
        const result = await analyticsService.trackEvent(eventData);
        res.json(result);
    } catch (error) {
        console.error('Analytics Track Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 6. Notification Test Endpoint
app.post('/api/notifications/test', async (req, res) => {
    try {
        const { type, message } = req.body;
        // Mock user
        const user = { id: 1, email: 'test@example.com', phone: '9876543210' };

        if (type === 'match') {
            await notificationService.sendJobMatchAlert(user, { title: 'Test Job', company: 'Test Co', url: '#' }, 95);
        } else {
            await notificationService.sendPushNotification(user.id, message || 'Test Notification');
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Notification Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 7. Community & Referrals Endpoint
app.get('/api/community/referrals', async (req, res) => {
    try {
        const { company } = req.query;
        const connections = await referralService.findReferralConnections(1, company || '');
        res.json({ connections });
    } catch (error) {
        console.error('Referral Error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/community/groups', async (req, res) => {
    try {
        const groups = await referralService.getCommunityGroups();
        res.json({ groups });
    } catch (error) {
        console.error('Community Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 8. Premium & Monetization Endpoints

// Get User Subscription & Credits
app.get('/api/user/status', async (req, res) => {
    try {
        const userId = req.query.userId || 'demo-user';
        const subscription = await premiumService.getUserSubscription(userId);
        const credits = await monetizationService.getCredits(userId);
        res.json({ subscription, credits });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Upgrade Subscription
app.post('/api/premium/upgrade', async (req, res) => {
    try {
        const { userId, tier } = req.body;
        const result = await premiumService.upgradeUser(userId || 'demo-user', tier);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Company Insights (Premium Feature)
app.get('/api/company/insights', async (req, res) => {
    try {
        const { company, userId } = req.query;

        // Check if user has access (mock check)
        const sub = await premiumService.getUserSubscription(userId || 'demo-user');
        if (sub.tier === 'free') {
            // Deduct credits for free users
            await monetizationService.deductCredits(userId || 'demo-user', 'company_insights', 15);
        }

        const insights = await premiumService.getCompanyInsights(company);
        res.json(insights);
    } catch (error) {
        res.status(403).json({ error: error.message });
    }
});

// Referral Invite
app.post('/api/referral/invite', async (req, res) => {
    try {
        const { userId, email } = req.body;
        const code = await monetizationService.generateReferralCode(userId || 'demo-user');
        // Mock sending email
        console.log('[REFERRAL] Sent invite to ' + email + ' with code ' + code);
        res.json({ success: true, code });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 9. Advanced AI & Compliance Endpoints

// ATS Score
app.post('/api/ats/score', async (req, res) => {
    try {
        const { resumeText, jobDescription } = req.body;
        const result = await atsService.calculateATSScore(resumeText, jobDescription);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Culture Fit
app.post('/api/culture/analyze', async (req, res) => {
    try {
        const { userProfile, companyInfo } = req.body;
        const result = await cultureFitService.analyzeCultureFit(userProfile, companyInfo);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Compliance - Consent
app.post('/api/compliance/consent', async (req, res) => {
    try {
        const { userId, consentType } = req.body;
        const ip = req.ip;
        await complianceService.recordConsent(userId, consentType, ip);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Compliance - Export Data
app.get('/api/compliance/export', async (req, res) => {
    try {
        const { userId } = req.query;
        const data = await complianceService.exportUserData(userId);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Compliance - Delete Account
app.post('/api/compliance/delete', async (req, res) => {
    try {
        const { userId, reason } = req.body;
        const result = await complianceService.requestDeletion(userId, reason);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 10. Orion AI Coach Endpoint
const OrionCoachService = require('./services/OrionCoachService');
const orionCoach = new OrionCoachService(process.env.OPENAI_API_KEY);

app.post('/api/orion/chat', async (req, res) => {
    try {
        const { message, history } = req.body;
        const response = await orionCoach.chat(message, history);
        res.json({ response });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start Server
app.listen(port, () => {
    console.log('JoBika AI Backend running on port ' + port);
});

