const express = require('express');
const router = express.Router();
const cache = require('../utils/CacheService');

// Clear all cache
router.post('/clear-cache', async (req, res) => {
    try {
        // Clear memory cache
        if (cache.memoryCache) {
            cache.memoryCache.clear();
        }

        res.json({
            success: true,
            message: 'Cache cleared successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
