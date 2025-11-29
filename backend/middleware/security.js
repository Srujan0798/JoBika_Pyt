// Security Middleware (XSS, SQL Injection Prevention, CSRF, Headers)

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const sanitize = require('xss-clean');

class SecurityMiddleware {
    // Issue #61-65: Security Headers
    securityHeaders() {
        return helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
                    imgSrc: ["'self'", "data:", "https:"],
                },
            },
            hsts: {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true
            }
        });
    }

    // Issue #62: XSS Protection
    xssProtection() {
        return sanitize();
    }

    // Rate Limiting (DDoS Protection)
    rateLimiter() {
        return rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // limit each IP to 100 requests per windowMs
            message: 'Too many requests from this IP, please try again later.',
            standardHeaders: true,
            legacyHeaders: false,
        });
    }

    // API Rate Limiting (stricter)
    apiRateLimiter() {
        return rateLimit({
            windowMs: 1 * 60 * 1000, // 1 minute
            max: 30,
            message: 'API rate limit exceeded',
        });
    }

    // Auth Rate Limiting (prevent brute force)
    authRateLimiter() {
        return rateLimit({
            windowMs: 15 * 60 * 1000,
            max: 5, // 5 login attempts per 15 minutes
            message: 'Too many login attempts, please try again later',
            skipSuccessfulRequests: true,
        });
    }

    // Request Timeout
    requestTimeout(timeoutMs = 30000) {
        return (req, res, next) => {
            req.setTimeout(timeoutMs, () => {
                res.status(408).json({ error: 'Request timeout' });
            });
            next();
        };
    }

    // Body Size Limit (prevent payload attacks)
    bodySizeLimit() {
        return (req, res, next) => {
            const limit = 10 * 1024 * 1024; // 10MB
            if (req.headers['content-length'] && parseInt(req.headers['content-length']) > limit) {
                return res.status(413).json({ error: 'Request entity too large' });
            }
            next();
        };
    }

    // CORS Configuration
    corsOptions() {
        return {
            origin: (origin, callback) => {
                const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];

                // Allow requests with no origin (mobile apps, curl, etc.)
                if (!origin) return callback(null, true);

                if (allowedOrigins.includes(origin) || origin.includes('vercel.app')) {
                    callback(null, true);
                } else {
                    callback(new Error('Not allowed by CORS'));
                }
            },
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
            allowedHeaders: ['Content-Type', 'Authorization']
        };
    }

    // SQL Injection Prevention Helper
    sanitizeSQLInput(input) {
        if (typeof input !== 'string') return input;

        // Remove dangerous SQL keywords
        const dangerous = /('|(--)|;|\/\*|\*\/|xp_|sp_|exec|execute|drop|create|alter|insert|update|delete)/gi;
        return input.replace(dangerous, '');
    }

    // Input Validation Middleware
    validateInput(schema) {
        return (req, res, next) => {
            const { error } = schema.validate(req.body);
            if (error) {
                return res.status(400).json({
                    error: 'Validation error',
                    details: error.details.map(d => d.message)
                });
            }
            next();
        };
    }
}

module.exports = new SecurityMiddleware();
