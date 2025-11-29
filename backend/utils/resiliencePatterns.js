/**
 * Circuit Breaker Pattern (Netflix/Uber)
 * Prevents cascading failures by stopping calls to failing services
 */
class CircuitBreaker {
    constructor(options = {}) {
        this.failureThreshold = options.failureThreshold || 5;
        this.resetTimeout = options.resetTimeout || 60000; // 60 seconds
        this.monitoringPeriod = options.monitoringPeriod || 10000; // 10 seconds

        this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
        this.failureCount = 0;
        this.lastFailureTime = null;
        this.successCount = 0;
    }

    async execute(fn) {
        if (this.state === 'OPEN') {
            // Check if we should try half-open
            if (Date.now() - this.lastFailureTime > this.resetTimeout) {
                this.state = 'HALF_OPEN';
                console.log('Circuit breaker entering HALF_OPEN state');
            } else {
                throw new Error('Circuit breaker is OPEN - service unavailable');
            }
        }

        try {
            const result = await fn();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }

    onSuccess() {
        this.failureCount = 0;

        if (this.state === 'HALF_OPEN') {
            this.state = 'CLOSED';
            console.log('Circuit breaker CLOSED - service recovered');
        }
    }

    onFailure() {
        this.failureCount++;
        this.lastFailureTime = Date.now();

        if (this.failureCount >= this.failureThreshold) {
            this.state = 'OPEN';
            console.error(`Circuit breaker OPEN - ${this.failureCount} failures detected`);
        }
    }

    getState() {
        return this.state;
    }
}

/**
 * Retry with Exponential Backoff + Jitter (Uber Pattern)
 * Prevents "Thundering Herd" problem
 */
class RetryWithBackoff {
    constructor(options = {}) {
        this.maxAttempts = options.maxAttempts || 3;
        this.initialDelay = options.initialDelay || 1000;
        this.maxDelay = options.maxDelay || 10000;
        this.backoffMultiplier = options.backoffMultiplier || 2;
    }

    async execute(fn, context = 'operation') {
        let lastError;

        for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;

                if (attempt === this.maxAttempts) {
                    console.error(`${context} failed after ${this.maxAttempts} attempts`);
                    throw error;
                }

                // Calculate delay with exponential backoff
                const baseDelay = Math.min(
                    this.initialDelay * Math.pow(this.backoffMultiplier, attempt - 1),
                    this.maxDelay
                );

                // Add jitter (random 0-50% of base delay) to prevent thundering herd
                const jitter = Math.random() * baseDelay * 0.5;
                const delay = baseDelay + jitter;

                console.log(`${context} attempt ${attempt} failed. Retrying in ${delay}ms...`);
                await this.sleep(delay);
            }
        }

        throw lastError;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * Graceful Degradation Manager (Instagram Pattern)
 * Falls back to cached/simplified versions when services fail
 */
class GracefulDegradation {
    constructor() {
        this.fallbacks = new Map();
        this.cache = new Map();
    }

    registerFallback(serviceKey, fallbackFn) {
        this.fallbacks.set(serviceKey, fallbackFn);
    }

    async executeWithFallback(serviceKey, primaryFn, options = {}) {
        try {
            const result = await primaryFn();

            // Cache successful result
            if (options.cacheResult) {
                this.cache.set(serviceKey, {
                    data: result,
                    timestamp: Date.now()
                });
            }

            return result;
        } catch (error) {
            console.warn(`Primary service ${serviceKey} failed, using fallback:`, error.message);

            // Try cache first
            const cached = this.cache.get(serviceKey);
            if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes
                console.log(`Using cached result for ${serviceKey}`);
                return cached.data;
            }

            // Use registered fallback
            const fallback = this.fallbacks.get(serviceKey);
            if (fallback) {
                return await fallback();
            }

            // Last resort: return safe default
            console.error(`No fallback available for ${serviceKey}`);
            return this.getSafeDefault(serviceKey);
        }
    }

    getSafeDefault(serviceKey) {
        const defaults = {
            'job_search': [],
            'ai_chat': { message: 'AI service temporarily unavailable. Please try again.' },
            'analytics': { stats: { applications: 0, views: 0, responses: 0 } }
        };

        return defaults[serviceKey] || null;
    }
}

/**
 * Connection Pool Manager (Uber Pattern)
 * Prevents pool exhaustion
 */
class ConnectionPoolManager {
    constructor(pool, options = {}) {
        this.pool = pool;
        this.maxWaitTime = options.maxWaitTime || 5000;
        this.acquireTimeout = options.acquireTimeout || 3000;
        this.activeConnections = 0;
        this.maxConnections = options.maxConnections || 20;
    }

    async withConnection(fn) {
        if (this.activeConnections >= this.maxConnections) {
            throw new Error('Connection pool exhausted');
        }

        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Connection acquire timeout')), this.acquireTimeout);
        });

        let client;
        try {
            this.activeConnections++;

            // Race between getting connection and timeout
            client = await Promise.race([
                this.pool.connect(),
                timeoutPromise
            ]);

            const result = await fn(client);
            return result;
        } finally {
            if (client) {
                client.release();
            }
            this.activeConnections--;
        }
    }

    getStats() {
        return {
            active: this.activeConnections,
            max: this.maxConnections,
            utilization: (this.activeConnections / this.maxConnections) * 100
        };
    }
}

// Global instances
const dbCircuitBreaker = new CircuitBreaker({ failureThreshold: 5, resetTimeout: 30000 });
const apiRetry = new RetryWithBackoff({ maxAttempts: 3, initialDelay: 1000 });
const gracefulDegradation = new GracefulDegradation();

// Register fallbacks for critical services
gracefulDegradation.registerFallback('job_search', async () => {
    return []; // Return empty array if job search fails
});

gracefulDegradation.registerFallback('ai_chat', async () => {
    return {
        message: "I'm temporarily unavailable. Please try again in a moment.",
        isFallback: true
    };
});

module.exports = {
    CircuitBreaker,
    RetryWithBackoff,
    GracefulDegradation,
    ConnectionPoolManager,
    dbCircuitBreaker,
    apiRetry,
    gracefulDegradation
};
