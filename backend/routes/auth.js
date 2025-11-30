const express = require('express');
const router = express.Router();
const AuthService = require('../services/AuthService');
const authService = new AuthService();
const db = require('../database/db');
const authMiddleware = require('../middleware/auth');

router.post('/register', async (req, res) => {
    try {
        const { email, password, name, ...profileData } = req.body;
        const result = await authService.register(email, password, name, profileData);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await authService.login(email, password);
        res.json(result);
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
});

router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await db.getUserById(req.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                profileData: JSON.parse(user.profile_data || '{}')
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
