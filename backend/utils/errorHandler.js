// Enhanced Error Handlers for Production
// Fixes: Unhandled promise rejections, uncaught exceptions, graceful shutdown

const logger = {
    error: (msg, meta) => console.error(`[ERROR] ${msg}`, meta || ''),
    warn: (msg, meta) => console.warn(`[WARN] ${msg}`, meta || ''),
    info: (msg) => console.log(`[INFO] ${msg}`)
};

class ErrorHandler {
    constructor() {
        this.setupGlobalHandlers();
    }

    setupGlobalHandlers() {
        // Issue #1: Unhandled Promise Rejections (60% of Node.js crashes)
        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled Promise Rejection', {
                reason: reason,
                promise: promise
            });

            // In production, you'd send this to Sentry/error tracking
            // For now, we log and continue (don't crash)
        });

        // Uncaught Exceptions
        process.on('uncaughtException', (error) => {
            logger.error('Uncaught Exception', {
                message: error.message,
                stack: error.stack
            });

            // Give time to log before exiting
            setTimeout(() => {
                process.exit(1);
            }, 1000);
        });

        // Graceful Shutdown
        process.on('SIGTERM', this.gracefulShutdown.bind(this));
        process.on('SIGINT', this.gracefulShutdown.bind(this));
    }

    gracefulShutdown() {
        logger.info('Received shutdown signal, closing gracefully...');

        // Close server
        if (global.server) {
            global.server.close(() => {
                logger.info('Server closed');
                process.exit(0);
            });

            // Force close after 10 seconds
            setTimeout(() => {
                logger.error('Forced shutdown after timeout');
                process.exit(1);
            }, 10000);
        } else {
            process.exit(0);
        }
    }

    // Async error wrapper
    asyncHandler(fn) {
        return (req, res, next) => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };
    }

    // Express error middleware
    errorMiddleware() {
        return (err, req, res, next) => {
            logger.error('Request Error', {
                message: err.message,
                stack: err.stack,
                url: req.url,
                method: req.method
            });

            // Don't expose error details in production
            const isDev = process.env.NODE_ENV === 'development';

            res.status(err.status || 500).json({
                error: {
                    message: isDev ? err.message : 'Internal server error',
                    ...(isDev && { stack: err.stack })
                }
            });
        };
    }
}

module.exports = new ErrorHandler();
