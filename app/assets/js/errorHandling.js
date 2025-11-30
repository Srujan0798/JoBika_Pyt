/**
 * React Error Boundary (Frontend Protection)
 * Prevents entire app from crashing when component errors occur
 */

class ErrorBoundary {
    constructor() {
        this.hasError = false;
        this.error = null;
        this.errorInfo = null;
    }

    static create() {
        return new ErrorBoundary();
    }

    componentDidCatch(error, errorInfo) {
        this.hasError = true;
        this.error = error;
        this.errorInfo = errorInfo;

        // Log to error reporting service (Sentry, LogRocket, etc.)
        console.error('Error Boundary Caught:', error, errorInfo);

        // Send to backend for logging
        if (window.JoBikaAPI) {
            window.JoBikaAPI.logError({
                error: error.toString(),
                componentStack: errorInfo.componentStack,
                url: window.location.href,
                userAgent: navigator.userAgent
            }).catch(e => console.error('Failed to log error:', e));
        }
    }

    render(children) {
        if (this.hasError) {
            return this.renderErrorFallback();
        }
        return children;
    }

    renderErrorFallback() {
        return `
            <div class="error-boundary-fallback">
                <div class="error-boundary-content">
                    <h2>⚠️ Something went wrong</h2>
                    <p>We're sorry, but something unexpected happened. Don't worry, your data is safe.</p>
                    <button onclick="window.location.reload()" class="btn-primary">
                        Refresh Page
                    </button>
                    <button onclick="window.history.back()" class="btn-secondary">
                        Go Back
                    </button>
                    ${process.env.NODE_ENV === 'development' ? `
                        <details style="margin-top: 20px;">
                            <summary>Error Details (Dev Only)</summary>
                            <pre style="text-align: left; padding: 10px; background: #f5f5f5; overflow: auto;">
${this.error && this.error.toString()}
${this.errorInfo && this.errorInfo.componentStack}
                            </pre>
                        </details>
                    ` : ''}
                </div>
            </div>
        `;
    }
}

/**
 * Global Error Handlers (Vanilla JS)
 */
function setupGlobalErrorHandlers() {
    // Catch unhandled JavaScript errors
    window.addEventListener('error', (event) => {
        console.error('Global error:', event.error);

        // Prevent infinite loops
        if (event.error && event.error.message && event.error.message.includes('Script error')) {
            return; // CORS-related, can't do much
        }

        // Log to backend
        if (window.JoBikaAPI) {
            window.JoBikaAPI.logError({
                type: 'javascript_error',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack
            }).catch(e => console.error('Failed to log error:', e));
        }

        // Show user-friendly message
        showErrorToast('An unexpected error occurred. Please refresh the page.');
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);

        if (window.JoBikaAPI) {
            window.JoBikaAPI.logError({
                type: 'unhandled_rejection',
                reason: event.reason?.toString(),
                stack: event.reason?.stack
            }).catch(e => console.error('Failed to log error:', e));
        }

        // Show user-friendly message for API errors
        if (event.reason?.message?.includes('fetch') || event.reason?.message?.includes('network')) {
            showErrorToast('Network error. Please check your connection.');
        } else {
            showErrorToast('An unexpected error occurred.');
        }
    });
}

/**
 * Network Error Recovery
 */
class NetworkErrorRecovery {
    constructor() {
        this.isOnline = navigator.onLine;
        this.setupListeners();
    }

    setupListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            showSuccessToast('Connection restored!');
            // Retry pending requests
            this.retryPendingRequests();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            showErrorToast('No internet connection');
        });
    }

    retryPendingRequests() {
        // Implement retry logic for failed requests
        // console.log('Retrying pending requests...');
    }

    checkConnection() {
        return this.isOnline;
    }
}

/**
 * Loading State Manager
 */
class LoadingStateManager {
    constructor() {
        this.activeLoaders = new Set();
    }

    show(id = 'global') {
        this.activeLoaders.add(id);
        this.updateUI();
    }

    hide(id = 'global') {
        this.activeLoaders.delete(id);
        this.updateUI();
    }

    isLoading(id = null) {
        if (id) {
            return this.activeLoaders.has(id);
        }
        return this.activeLoaders.size > 0;
    }

    updateUI() {
        const loader = document.getElementById('global-loader');
        if (this.activeLoaders.size > 0) {
            if (loader) loader.style.display = 'flex';
        } else {
            if (loader) loader.style.display = 'none';
        }
    }
}

/**
 * Toast Notification System
 */
function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    const container = document.getElementById('toast-container') || createToastContainer();
    container.appendChild(toast);

    // Animate in
    setTimeout(() => toast.classList.add('show'), 10);

    // Remove after duration
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

function showErrorToast(message) {
    showToast(message, 'error', 5000);
}

function showSuccessToast(message) {
    showToast(message, 'success', 3000);
}

function showWarningToast(message) {
    showToast(message, 'warning', 4000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 10000;';
    document.body.appendChild(container);
    return container;
}

/**
 * Local Storage with Quota Management
 */
class SmartStorage {
    constructor(prefix = 'jobika_') {
        this.prefix = prefix;
        this.maxSize = 5 * 1024 * 1024; // 5MB limit
    }

    set(key, value) {
        try {
            const fullKey = this.prefix + key;
            const serialized = JSON.stringify(value);

            // Check size
            if (this.getStorageSize() + serialized.length > this.maxSize) {
                this.cleanup();
            }

            localStorage.setItem(fullKey, serialized);
            return true;
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                console.error('Storage quota exceeded');
                this.cleanup();
                return false;
            }
            throw e;
        }
    }

    get(key) {
        try {
            const fullKey = this.prefix + key;
            const item = localStorage.getItem(fullKey);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.error('Error reading from storage:', e);
            return null;
        }
    }

    remove(key) {
        localStorage.removeItem(this.prefix + key);
    }

    cleanup() {
        // Remove old items
        const keys = Object.keys(localStorage).filter(k => k.startsWith(this.prefix));
        keys.slice(0, Math.floor(keys.length / 2)).forEach(k => {
            localStorage.removeItem(k);
        });
    }

    getStorageSize() {
        let size = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                size += localStorage[key].length + key.length;
            }
        }
        return size;
    }
}

// Initialize global instances
const errorBoundary = ErrorBoundary.create();
const loadingManager = new LoadingStateManager();
const networkRecovery = new NetworkErrorRecovery();
const storage = new SmartStorage();

// Setup on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupGlobalErrorHandlers);
} else {
    setupGlobalErrorHandlers();
}

// Export for use
window.ErrorBoundary = errorBoundary;
window.LoadingManager = loadingManager;
window.NetworkRecovery = networkRecovery;
window.SmartStorage = storage;
window.showToast = showToast;
window.showErrorToast = showErrorToast;
window.showSuccessToast = showSuccessToast;
window.showWarningToast = showWarningToast;
