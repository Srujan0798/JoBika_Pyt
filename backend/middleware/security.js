const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss-clean');
const crypto = require('crypto');

// 1. Security Headers (Helmet)
const securityHeaders = () => {
    return helmet({
        contentSecurityPolicy: false, // Disable CSP for now to avoid frontend issues
        crossOriginEmbedderPolicy: false
    });
};

// 2. XSS Protection
const xssProtection = () => {
    return xss();
};

// 3. Request Timeout
const requestTimeout = (seconds = 30) => {
    return (req, res, next) => {
        req.setTimeout(seconds * 1000, () => {
            res.status(408).send('Request Timeout');
        });
        next();
    };
};

// 4. Rate Limiter (General API)
const rateLimiter = () => {
    return rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // Limit each IP to 100 requests per windowMs
        standardHeaders: true,
        legacyHeaders: false,
        message: { error: 'Too many requests, please try again later.' }
    });
};

// 5. Auth Rate Limiter (Stricter)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Too many login attempts, please try again later.' }
});

// 6. CORS Options
// 6. CORS Options
const corsOptions = () => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',')
        : ['http://localhost:3000', 'http://localhost:3001', process.env.FRONTEND_URL || '*'];

    return {
        origin: (origin, callback) => {
            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin) return callback(null, true);

            if (allowedOrigins.includes('*') || allowedOrigins.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true
    };
};

// Encryption Utilities
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

module.exports = {
    securityHeaders,
    xssProtection,
    requestTimeout,
    rateLimiter,
    authLimiter,
    corsOptions,
    encrypt,
    decrypt
};
