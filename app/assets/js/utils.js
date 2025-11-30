/**
 * JoBika Toast Notification System
 * Simple, elegant toast notifications
 */

class ToastManager {
    constructor() {
        this.container = null;
        this.toasts = [];
        this.init();
    }

    init() {
        // Create toast container
        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
    }

    show(message, type = 'info', duration = 5000) {
        const toast = this.createToast(message, type);
        this.container.appendChild(toast);
        this.toasts.push(toast);

        // Auto remove after duration
        if (duration > 0) {
            setTimeout(() => this.remove(toast), duration);
        }

        return toast;
    }

    createToast(message, type) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        const titles = {
            success: 'Success',
            error: 'Error',
            warning: 'Warning',
            info: 'Info'
        };

        toast.innerHTML = `
            <div class="toast-icon">${icons[type] || icons.info}</div>
            <div class="toast-content">
                <div class="toast-title">${titles[type] || titles.info}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" aria-label="Close">×</button>
        `;

        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            this.remove(toast);
        });

        return toast;
    }

    remove(toast) {
        toast.classList.add('removing');
        setTimeout(() => {
            if (toast.parentElement) {
                toast.parentElement.removeChild(toast);
            }
            this.toasts = this.toasts.filter(t => t !== toast);
        }, 300);
    }

    success(message, duration) {
        return this.show(message, 'success', duration);
    }

    error(message, duration) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration) {
        return this.show(message, 'info', duration);
    }

    clear() {
        this.toasts.forEach(toast => this.remove(toast));
    }
}

/**
 * Loading Overlay
 */
class LoadingOverlay {
    constructor() {
        this.overlay = null;
    }

    show(message = 'Loading...') {
        if (this.overlay) return;

        this.overlay = document.createElement('div');
        this.overlay.className = 'loading-overlay';
        this.overlay.innerHTML = `
            <div class="spinner large"></div>
            <div class="loading-text">${message}</div>
        `;
        document.body.appendChild(this.overlay);
        document.body.style.overflow = 'hidden';
    }

    hide() {
        if (this.overlay && this.overlay.parentElement) {
            this.overlay.parentElement.removeChild(this.overlay);
            this.overlay = null;
            document.body.style.overflow = '';
        }
    }

    updateMessage(message) {
        if (this.overlay) {
            const textElement = this.overlay.querySelector('.loading-text');
            if (textElement) {
                textElement.textContent = message;
            }
        }
    }
}

/**
 * Progress Bar Helper
 */
class ProgressBar {
    constructor(element) {
        this.element = element;
        this.fillElement = element.querySelector('.progress-bar-fill');
        this.value = 0;
    }

    setValue(percentage) {
        this.value = Math.max(0, Math.min(100, percentage));
        if (this.fillElement) {
            this.fillElement.style.width = this.value + '%';
        }
    }

    setIndeterminate(enabled) {
        if (enabled) {
            this.element.classList.add('animated');
        } else {
            this.element.classList.remove('animated');
        }
    }

    reset() {
        this.setValue(0);
    }

    complete() {
        this.setValue(100);
    }
}

/**
 * Global Instances
 */
const toast = new ToastManager();
const loading = new LoadingOverlay();

/**
 * Utility Functions
 */

// Show loading spinner in element
function showSpinner(element, size = 'normal') {
    const spinner = document.createElement('div');
    spinner.className = `spinner ${size}`;
    spinner.dataset.spinner = 'true';
    element.appendChild(spinner);
    return spinner;
}

// Remove loading spinner
function hideSpinner(element) {
    const spinner = element.querySelector('[data-spinner="true"]');
    if (spinner) {
        spinner.remove();
    }
}

// Create skeleton loader
function createSkeleton(type = 'text', count = 1) {
    const container = document.createElement('div');
    for (let i = 0; i < count; i++) {
        const skeleton = document.createElement('div');
        skeleton.className = `skeleton skeleton-${type}`;
        container.appendChild(skeleton);
    }
    return container;
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function
function throttle(func, limit) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    // Less than 1 minute
    if (diff < 60000) {
        return 'Just now';
    }

    // Less than 1 hour
    if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }

    // Less than 1 day
    if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }

    // Less than 1 week
    if (diff < 604800000) {
        const days = Math.floor(diff / 86400000);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    }

    // Default format
    return date.toLocaleDateString();
}

// Copy to clipboard
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard!');
        return true;
    } catch (err) {
        toast.error('Failed to copy');
        return false;
    }
}

// Download file
function downloadFile(content, filename, type = 'text/plain') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Download started!');
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        toast,
        loading,
        ProgressBar,
        ToastManager,
        LoadingOverlay,
        formatDate,
        debounce,
        throttle,
        copyToClipboard,
        downloadFile
    };
}
