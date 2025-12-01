const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const OrionCoachService = require('../services/OrionCoachService');

// Initialize Orion service for message generation
const orionService = new OrionCoachService(process.env.GEMINI_API_KEY);

// GET /api/networking/connections - Mock LinkedIn connection finder
router.get('/connections', authMiddleware, async (req, res) => {
    try {
        const { company } = req.query;

        if (!company) {
            return res.status(400).json({ error: 'Company name is required' });
        }

        // Mock data generator
        const generateMockConnections = (companyName) => {
            const roles = ['Senior Developer', 'Tech Lead', 'Engineering Manager', 'HR Manager', 'Talent Acquisition'];
            const names = ['Aditi Sharma', 'Rahul Verma', 'Sneha Gupta', 'Vikram Singh', 'Priya Patel'];

            return names.map((name, index) => ({
                id: `conn_${index}`,
                name: name,
                role: roles[index % roles.length],
                company: companyName,
                profileUrl: `https://linkedin.com/in/${name.toLowerCase().replace(' ', '-')}`,
                mutualConnections: Math.floor(Math.random() * 15) + 1,
                isAlumni: Math.random() > 0.7
            }));
        };

        const connections = generateMockConnections(company);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        res.json({
            company: company,
            connections: connections,
            message: `Found ${connections.length} potential connections at ${company}`
        });

    } catch (error) {
        console.error('Networking API error:', error);
        res.status(500).json({ error: 'Failed to fetch connections' });
    }
});

// POST /api/networking/generate-message - Generate referral request
router.post('/generate-message', authMiddleware, async (req, res) => {
    try {
        const { connectionName, role, company, type = 'referral' } = req.body;

        if (!connectionName || !company) {
            return res.status(400).json({ error: 'Connection name and company are required' });
        }

        const prompt = `Write a professional and polite LinkedIn message to ${connectionName}, who is a ${role} at ${company}. 
        The purpose is to ask for a ${type} (e.g., referral, informational interview). 
        Keep it concise, under 200 words, and suitable for the Indian professional context.`;

        // Use Orion service to generate text
        // We'll reuse the chat method or add a new generation method. 
        // Since chatWithOrion expects history, let's use the underlying gemini instance if possible, 
        // or just use chatWithOrion with a system prompt override if we could, 
        // but easier to just use chatWithOrion as a one-off.

        const response = await orionService.chatWithOrion(prompt, []);

        res.json({
            generatedMessage: response,
            success: true
        });

    } catch (error) {
        console.error('Message generation error:', error);
        res.status(500).json({ error: 'Failed to generate message' });
    }
});

module.exports = router;
