const db = require('../database/db');

/**
 * Subscription Tier Management
 * Handles tier limits and usage tracking
 */

const TIER_LIMITS = {
    free: {
        daily_applications: 5,
        ai_chats_per_day: 5,
        resume_tailors_per_day: 3,
        saved_jobs: 20,
        job_alerts: 2,
        agent_enabled: false,
        insider_connections_per_day: 0,
        features: ['basic_job_search', 'application_tracker', 'resume_upload']
    },
    pro: {
        daily_applications: 50,
        ai_chats_per_day: -1, // unlimited
        resume_tailors_per_day: -1,
        saved_jobs: 500,
        job_alerts: 10,
        agent_enabled: false,
        insider_connections_per_day: 10,
        features: ['all_free', 'advanced_matching', 'company_insights', 'ats_optimization']
    },
    premium: {
        daily_applications: -1, // unlimited
        ai_chats_per_day: -1,
        resume_tailors_per_day: -1,
        saved_jobs: -1,
        job_alerts: -1,
        agent_enabled: true,
        insider_connections_per_day: -1,
        features: ['all_pro', 'ai_agent', 'mock_interviews', 'priority_support', 'salary_insights']
    }
};

class SubscriptionManager {
    static getLimits(tier) {
        return TIER_LIMITS[tier] || TIER_LIMITS.free;
    }

    static async checkLimit(userId, actionType) {
        const result = await db.query(
            'SELECT subscription_tier, credits_used_today, credits_reset_at FROM users WHERE id = $1',
            [userId]
        );

        if (!result.rows || result.rows.length === 0) {
            throw new Error('User not found');
        }

        const userData = result.rows[0];
        const tier = userData.subscription_tier || 'free';
        const limits = this.getLimits(tier);

        // Reset credits if it's a new day
        const now = new Date();
        const resetTime = new Date(userData.credits_reset_at);
        if (now.toDateString() !== resetTime.toDateString()) {
            await db.query(
                'UPDATE users SET credits_used_today = 0, credits_reset_at = $1 WHERE id = $2',
                [now, userId]
            );
            userData.credits_used_today = 0;
        }

        // Check specific action limit
        let limitKey;
        switch (actionType) {
            case 'application':
                limitKey = 'daily_applications';
                break;
            case 'chat':
                limitKey = 'ai_chats_per_day';
                break;
            case 'resume_tailor':
                limitKey = 'resume_tailors_per_day';
                break;
            case 'insider_connection':
                limitKey = 'insider_connections_per_day';
                break;
            default:
                return { allowed: true, remaining: -1 };
        }

        const limit = limits[limitKey];

        // -1 means unlimited
        if (limit === -1) {
            return { allowed: true, remaining: -1, tier, limitKey };
        }

        // Check if user has exceeded limit
        const used = userData.credits_used_today || 0;
        const allowed = used < limit;
        const remaining = Math.max(0, limit - used);

        return {
            allowed,
            remaining,
            tier,
            limitKey,
            upgrade_needed: !allowed
        };
    }

    static async trackUsage(userId, actionType) {
        const check = await this.checkLimit(userId, actionType);

        if (!check.allowed) {
            const error = new Error('Daily limit exceeded');
            error.statusCode = 402; // Payment Required
            error.tier = check.tier;
            error.limitKey = check.limitKey;
            throw error;
        }

        // Increment usage
        await db.query(
            'UPDATE users SET credits_used_today = credits_used_today + 1 WHERE id = $1',
            [userId]
        );

        return { success: true, remaining: check.remaining - 1 };
    }

    static async hasFeature(userId, featureName) {
        const result = await db.query(
            'SELECT subscription_tier FROM users WHERE id = $1',
            [userId]
        );

        if (!result.rows || result.rows.length === 0) {
            return false;
        }

        const tier = result.rows[0].subscription_tier || 'free';
        const limits = this.getLimits(tier);

        return limits.features.includes(featureName) ||
            limits.features.includes('all_free') ||
            limits.features.includes('all_pro');
    }

    static async getUsageStats(userId) {
        const result = await db.query(
            'SELECT subscription_tier, credits_used_today, credits_reset_at FROM users WHERE id = $1',
            [userId]
        );

        if (!result.rows || result.rows.length === 0) {
            throw new Error('User not found');
        }

        const userData = result.rows[0];
        const tier = userData.subscription_tier || 'free';
        const limits = this.getLimits(tier);

        return {
            tier,
            limits,
            used_today: userData.credits_used_today || 0,
            resets_at: userData.credits_reset_at
        };
    }

    static async upgradeTier(userId, newTier, expiresAt) {
        if (!TIER_LIMITS[newTier]) {
            throw new Error('Invalid tier');
        }

        await db.query(
            'UPDATE users SET subscription_tier = $1, subscription_expires_at = $2 WHERE id = $3',
            [newTier, expiresAt, userId]
        );

        return { success: true, new_tier: newTier };
    }

    static async checkExpiration(userId) {
        const result = await db.query(
            'SELECT subscription_tier, subscription_expires_at FROM users WHERE id = $1',
            [userId]
        );

        if (!result.rows || result.rows.length === 0) {
            return;
        }

        const userData = result.rows[0];

        if (userData.subscription_tier !== 'free' && userData.subscription_expires_at) {
            const now = new Date();
            const expiresAt = new Date(userData.subscription_expires_at);

            if (now > expiresAt) {
                // Downgrade to free
                await db.query(
                    'UPDATE users SET subscription_tier = $1, subscription_expires_at = NULL WHERE id = $2',
                    ['free', userId]
                );

                console.log(`User ${userId} subscription expired, downgraded to free`);
            }
        }
    }
}

// Express Middleware
function checkSubscriptionMiddleware(actionType) {
    return async (req, res, next) => {
        try {
            if (!req.user || !req.user.id) {
                return res.status(401).json({ error: 'Authentication required' });
            }

            // Check expiration
            await SubscriptionManager.checkExpiration(req.user.id);

            // Check limit
            const check = await SubscriptionManager.checkLimit(req.user.id, actionType);

            if (!check.allowed) {
                return res.status(402).json({
                    error: 'Daily limit exceeded',
                    message: `You've reached your daily limit for ${actionType}. Upgrade to continue!`,
                    tier: check.tier,
                    upgrade_to: check.tier === 'free' ? 'pro' : 'premium',
                    upgrade_url: '/pricing'
                });
            }

            // Attach limits info to request
            req.subscriptionCheck = check;

            next();
        } catch (error) {
            console.error('Subscription middleware error:', error);
            res.status(500).json({ error: 'Subscription check failed' });
        }
    };
}

function requireFeature(featureName) {
    return async (req, res, next) => {
        try {
            if (!req.user || !req.user.id) {
                return res.status(401).json({ error: 'Authentication required' });
            }

            const hasFeature = await SubscriptionManager.hasFeature(req.user.id, featureName);

            if (!hasFeature) {
                return res.status(403).json({
                    error: 'Feature not available',
                    message: `This feature requires a paid subscription.`,
                    feature: featureName,
                    upgrade_url: '/pricing'
                });
            }

            next();
        } catch (error) {
            console.error('Feature check error:', error);
            res.status(500).json({ error: 'Feature check failed' });
        }
    };
}

module.exports = {
    SubscriptionManager,
    checkSubscriptionMiddleware,
    requireFeature,
    TIER_LIMITS
};
