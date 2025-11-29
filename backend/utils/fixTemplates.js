/**
 * Golden Fix Templates - Meta-Grade Patterns
 * These are battle-tested patterns from Netflix, Uber, Instagram, AWS
 */

// ============================================================
// TEMPLATE A: Circuit Breaker (Prevents Database Death)
// USE WHEN: DB timeouts occur > 5 times in 1 minute
// SOURCE: Netflix Hystrix
// ============================================================

class CircuitBreaker {
    constructor(request, options = {}) {
        this.request = request;
        this.state = "CLOSED"; // OPEN = fail fast, CLOSED = allow traffic, HALF_OPEN = testing
        this.failureCount = 0;
        this.successCount = 0;
        this.resetTimeout = options.resetTimeout || 10000; // 10 seconds
        this.threshold = options.threshold || 5;
        this.lastFailureTime = null;
    }

    async fire(...args) {
        if (this.state === "OPEN") {
            // Fail fast - don't even try
            if (Date.now() - this.lastFailureTime > this.resetTimeout) {
                this.state = "HALF_OPEN";
                console.log("Circuit HALF_OPEN - testing service...");
            } else {
                throw new Error("Circuit Breaker OPEN: Service Unavailable");
            }
        }

        try {
            const response = await this.request(...args);
            this.onSuccess();
            return response;
        } catch (err) {
            this.onFailure(err);
            throw err;
        }
    }

    onSuccess() {
        this.failureCount = 0;
        if (this.state === "HALF_OPEN") {
            this.successCount++;
            if (this.successCount >= 2) {
                this.state = "CLOSED";
                console.log("Circuit CLOSED - service recovered");
                this.successCount = 0;
            }
        }
    }

    onFailure(err) {
        this.failureCount++;
        this.lastFailureTime = Date.now();
        this.successCount = 0;

        if (this.failureCount >= this.threshold) {
            this.state = "OPEN";
            console.error(`Circuit OPEN - ${this.failureCount} failures. Service degraded.`);
        }
    }

    getState() {
        return {
            state: this.state,
            failures: this.failureCount,
            successes: this.successCount
        };
    }
}

// ============================================================
// TEMPLATE B: Exponential Backoff with Jitter (Thundering Herd Prevention)
// USE WHEN: Any 3rd party API call (Stripe, AWS, OpenAI, Gemini)
// SOURCE: Uber Engineering, AWS Best Practices
// ============================================================

async function fetchWithRetry(url, options = {}, config = {}) {
    const {
        retries = 3,
        baseDelay = 300,
        maxDelay = 10000,
        jitterPercent = 50
    } = config;

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await fetch(url, options);

            if (!response.ok && attempt < retries) {
                throw new Error(`HTTP ${response.status}`);
            }

            return response;
        } catch (err) {
            if (attempt === retries) {
                console.error(`All ${retries} attempts failed for ${url}`);
                throw err;
            }

            // Exponential backoff: 300ms, 600ms, 1200ms...
            const baseWait = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);

            // Add jitter to prevent thundering herd
            const jitter = baseWait * (Math.random() * jitterPercent / 100);
            const finalDelay = baseWait + jitter;

            console.log(`Retry ${attempt}/${retries} in ${finalDelay}ms...`);
            await new Promise(r => setTimeout(r, finalDelay));
        }
    }
}

// ============================================================
// TEMPLATE C: Graceful Shutdown (Prevents Data Loss on Restart)
// USE WHEN: Always! Add to server.js/index.js
// SOURCE: Node.js Best Practices, Docker/K8s Requirements
// ============================================================

function setupGracefulShutdown(server, cleanup = []) {
    let isShuttingDown = false;

    const shutdown = async (signal) => {
        if (isShuttingDown) return;
        isShuttingDown = true;

        console.log(`\n${signal} received: Starting graceful shutdown...`);

        // Stop accepting new connections
        server.close(() => {
            console.log('✅ HTTP server closed');
        });

        // Set timeout to force shutdown
        const forceTimeout = setTimeout(() => {
            console.error('❌ Forcefully shutting down after timeout');
            process.exit(1);
        }, 30000); // 30 seconds

        try {
            // Run cleanup functions (DB close, cache flush, etc.)
            for (const fn of cleanup) {
                await fn();
            }

            clearTimeout(forceTimeout);
            console.log('✅ Graceful shutdown complete');
            process.exit(0);
        } catch (error) {
            console.error('❌ Error during shutdown:', error);
            process.exit(1);
        }
    };

    // Listen for termination signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
        console.error('Uncaught Exception:', error);
        shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
        // Don't exit for unhandled rejections (might be recoverable)
    });
}

// ============================================================
// TEMPLATE D: Request Timeout Wrapper (Prevents Hanging Requests)
// USE WHEN: Calling any external service
// SOURCE: Slack Engineering
// ============================================================

function withTimeout(promise, timeoutMs = 5000) {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
        )
    ]);
}

// Usage
async function callExternalAPI(url) {
    return withTimeout(
        fetch(url),
        5000 // 5 second timeout
    );
}

// ============================================================
// TEMPLATE E: Connection Pool Manager (Prevents Pool Exhaustion)
// USE WHEN: Using PostgreSQL, Redis, or any pooled resource
// SOURCE: Uber Migration Post-Mortem
// ============================================================

class PoolHealthMonitor {
    constructor(pool, options = {}) {
        this.pool = pool;
        this.warningThreshold = options.warningThreshold || 80; // 80% utilization
        this.criticalThreshold = options.criticalThreshold || 95; // 95% utilization
        this.checkInterval = options.checkInterval || 60000; // 1 minute

        this.startMonitoring();
    }

    startMonitoring() {
        setInterval(() => {
            const stats = this.getPoolStats();
            const utilization = (stats.active / stats.max) * 100;
            est
            if (utilization >= this.criticalThreshold) {
                console.error(`🚨 CRITICAL: Connection pool at ${utilization.toFixed(1)}%!`);
                // Trigger alert/page
            } else if (utilization >= this.warningThreshold) {
                console.warn(`⚠️  WARNING: Connection pool at ${utilization.toFixed(1)}%`);
            }
        }, this.checkInterval);
    }

    getPoolStats() {
        // Adapt based on your pool library
        return {
            max: this.pool.options.max || 20,
            active: this.pool.totalCount || 0,
            idle: this.pool.idleCount || 0,
            waiting: this.pool.waitingCount || 0
        };
    }
}

// ============================================================
// TEMPLATE F: Rate Limiter (DDoS Protection)
// USE WHEN: Public endpoints, especially auth
// SOURCE: Instagram Engineering
// ============================================================

class TokenBucketRateLimiter {
    constructor(options = {}) {
        this.capacity = options.capacity || 100; // max tokens
        this.refillRate = options.refillRate || 10; // tokens per second
        this.tokens = this.capacity;
        this.lastRefill = Date.now();
    }

    tryConsume(tokens = 1) {
        this.refill();

        if (this.tokens >= tokens) {
            this.tokens -= tokens;
            return true;
        }

        return false; // Rate limited
    }

    refill() {
        const now = Date.now();
        const timePassed = (now - this.lastRefill) / 1000; // seconds
        const tokensToAdd = timePassed * this.refillRate;

        this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
        this.lastRefill = now;
    }
}

// Express middleware
function createRateLimiter(options) {
    const limiters = new Map(); // ip -> limiter

    return (req, res, next) => {
        const ip = req.ip || req.connection.remoteAddress;

        if (!limiters.has(ip)) {
            limiters.set(ip, new TokenBucketRateLimiter(options));
        }

        const limiter = limiters.get(ip);

        if (limiter.tryConsume()) {
            next();
        } else {
            res.status(429).json({ error: 'Too many requests' });
        }
    };
}

// ============================================================
// TEMPLATE G: Cache-Aside Pattern (Performance + Resilience)
// USE WHEN: Expensive DB queries or API calls
// SOURCE: Meta/Facebook Engineering
// ============================================================

class CacheAside {
    constructor(cache, dataSource, options = {}) {
        this.cache = cache; // Redis client or Map
        this.dataSource = dataSource; // Function to fetch data
        this.ttl = options.ttl || 300; // 5 minutes
    }

    async get(key) {
        // Try cache first
        const cached = await this.cache.get(key);
        if (cached) {
            return JSON.parse(cached);
        }

        // Cache miss - fetch from source
        const data = await this.dataSource(key);

        // Store in cache for next time
        await this.cache.set(key, JSON.stringify(data), 'EX', this.ttl);

        return data;
    }

    async invalidate(key) {
        await this.cache.del(key);
    }
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
    CircuitBreaker,
    fetchWithRetry,
    setupGracefulShutdown,
    withTimeout,
    PoolHealthMonitor,
    TokenBucketRateLimiter,
    createRateLimiter,
    CacheAside
};
