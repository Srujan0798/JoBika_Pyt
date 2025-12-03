const express = require('express');
const router = express.Router();
const paymentService = require('../services/PaymentService');
const monetizationService = require('../services/MonetizationService');
const db = require('../database/db');
const authMiddleware = require('../middleware/auth');

// POST /api/payments/create-order
router.post('/create-order', authMiddleware, async (req, res) => {
    try {
        const { amount, currency, planId } = req.body;
        const userId = req.user.userId || req.user.id;

        if (!amount) {
            return res.status(400).json({ error: 'Amount is required' });
        }

        const receipt = `receipt_${userId}_${Date.now()}`;
        const order = await paymentService.createOrder(amount * 100, currency || 'INR', receipt); // Convert to paise

        res.json({
            success: true,
            order,
            key_id: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// POST /api/payments/verify
router.post('/verify', authMiddleware, async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId, credits } = req.body;
        const userId = req.user.userId || req.user.id;

        const isValid = paymentService.verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

        if (isValid) {
            // Payment successful, fulfill the order

            if (planId) {
                // Update subscription
                await db.query('UPDATE users SET subscription_tier = $1 WHERE id = $2', [planId, userId]);

                // Add default credits for the plan
                let creditAmount = 0;
                if (planId === 'starter') creditAmount = 50;
                if (planId === 'pro') creditAmount = 200;

                if (creditAmount > 0) {
                    await monetizationService.addCredits(userId, creditAmount);
                }
            } else if (credits) {
                // Add specific credits
                await monetizationService.addCredits(userId, parseInt(credits));
            }

            res.json({ success: true, message: 'Payment verified and processed' });
        } else {
            res.status(400).json({ success: false, error: 'Invalid signature' });
        }
    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({ error: 'Failed to verify payment' });
    }
});

module.exports = router;
