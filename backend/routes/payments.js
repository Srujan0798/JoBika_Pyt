const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const db = require('../database/db');

// GET /api/payments/plans - List subscription tiers
router.get('/plans', (req, res) => {
    const plans = [
        {
            id: 'free',
            name: 'JobSaathi Free',
            price: 0,
            features: ['Basic Job Search', '1 Resume Tailoring/day', 'Community Access']
        },
        {
            id: 'pro',
            name: 'JobSaathi Pro',
            price: 499,
            currency: 'INR',
            interval: 'month',
            features: ['Unlimited Resume Tailoring', 'Priority Applications', 'AI Career Coach', 'Verified Badge'],
            recommended: true
        },
        {
            id: 'elite',
            name: 'JobSaathi Elite',
            price: 999,
            currency: 'INR',
            interval: 'month',
            features: ['Dedicated Human Mentor', 'Guaranteed Interviews', 'Resume Rewrite by Expert', 'All Pro Features']
        }
    ];
    res.json(plans);
});

// POST /api/payments/create-order - Mock Razorpay order
router.post('/create-order', authMiddleware, async (req, res) => {
    try {
        const { planId } = req.body;

        // Mock Order ID generation
        const orderId = `order_${Math.random().toString(36).substring(7)}`;

        // In a real app, we'd call Razorpay API here

        res.json({
            id: orderId,
            currency: 'INR',
            amount: planId === 'elite' ? 99900 : 49900, // Amount in paise
            planId: planId
        });
    } catch (error) {
        console.error('Payment order error:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// POST /api/payments/verify - Mock payment verification
router.post('/verify', authMiddleware, async (req, res) => {
    try {
        const { orderId, paymentId, signature, planId } = req.body;
        const userId = req.user.userId || req.user.id;

        // Mock verification logic
        // In real app, verify signature using crypto

        console.log(`💰 Payment verified for user ${userId}: ${planId}`);

        // Update user subscription in DB
        // We need to add subscription_tier to users table if not exists, or just store in a new table
        // For now, let's assume we update the user record

        await db.query('UPDATE users SET subscription_tier = ? WHERE id = ?', [planId, userId]);

        res.json({
            success: true,
            message: 'Subscription updated successfully',
            planId: planId
        });

    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({ error: 'Payment verification failed' });
    }
});

module.exports = router;
