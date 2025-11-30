const rateLimit = require('express-rate-limit');
const crypto = require('crypto');

// Rate Limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many requests from this IP, please try again later.'
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many login attempts, please try again later.'
});

// Encryption
const algorithm = 'aes-256-gcm';
const key = process.env.ENCRYPTION_KEY ? Buffer.from(process.env.ENCRYPTION_KEY, 'hex') : crypto.randomBytes(32);
const iv = crypto.randomBytes(16);

function encrypt(text) {
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return {
        iv: iv.toString('hex'),
        content: encrypted
    };
}

function decrypt(hash) {
    const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(hash.iv, 'hex'));
    let decrypted = decipher.update(hash.content, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

const helmet = require('helmet');
const xss = require('xss-clean');
const cors = require('cors');

module.exports = {
    apiLimiter,
    authLimiter,
    encrypt,
    decrypt,
    securityHeaders: () => helmet(),
    xssProtection: () => xss(),
    requestTimeout: () => (req, res, next) => {
        req.setTimeout(30000, () => {
            res.status(408).send('Request Timeout');
        });
        next();
    },
    rateLimiter: () => apiLimiter,
    corsOptions: () => ({
        origin: process.env.ALLOWED_ORIGINS || '*',
        optionsSuccessStatus: 200
    })
};
