/**
 * Performance Monitoring & Web Vitals
 * Tracks Core Web Vitals: LCP, FID, CLS
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            lcp: null,  // Largest Contentful Paint
            fid: null,  // First Input Delay
            cls: null,  // Cumulative Layout Shift
            ttfb: null, // Time to First Byte
            fcp: null   // First Contentful Paint
        };

        this.setupObservers();
    }

    setupObservers() {
        // LCP Observer
        if ('PerformanceObserver' in window) {
            try {
                const lcpObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    this.metrics.lcp = lastEntry.renderTime || lastEntry.loadTime;
                    this.checkThresholds('lcp', this.metrics.lcp);
                });
                lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
            } catch (e) {
                console.warn('LCP observer not supported');
            }

            // FID Observer
            try {
                const fidObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        this.metrics.fid = entry.processingStart - entry.startTime;
                        this.checkThresholds('fid', this.metrics.fid);
                    });
                });
                fidObserver.observe({ entryTypes: ['first-input'] });
            } catch (e) {
                console.warn('FID observer not supported');
            }

            // CLS Observer
            try {
                let clsValue = 0;
                const clsObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (!entry.hadRecentInput) {
                            clsValue += entry.value;
                        }
                    }
                    this.metrics.cls = clsValue;
                    this.checkThresholds('cls', this.metrics.cls);
                });
                clsObserver.observe({ entryTypes: ['layout-shift'] });
            } catch (e) {
                console.warn('CLS observer not supported');
            }
        }

        // Navigation Timing
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                if (perfData) {
                    this.metrics.ttfb = perfData.responseStart - perfData.requestStart;
                    this.metrics.fcp = perfData.domContentLoadedEventEnd - perfData.fetchStart;
                }

                this.sendMetrics();
            }, 0);
        });
    }

    checkThresholds(metric, value) {
        const thresholds = {
            lcp: { good: 2500, poor: 4000 },
            fid: { good: 100, poor: 300 },
            cls: { good: 0.1, poor: 0.25 },
            ttfb: { good: 800, poor: 1800 },
            fcp: { good: 1800, poor: 3000 }
        };

        const threshold = thresholds[metric];
        if (!threshold) return;

        if (value > threshold.poor) {
            // console.warn(`⚠️ ${metric.toUpperCase()} is POOR: ${value.toFixed(2)}`);
        } else if (value > threshold.good) {
            // console.log(`⚡ ${metric.toUpperCase()} needs improvement: ${value.toFixed(2)}`);
        } else {
            // console.log(`✅ ${metric.toUpperCase()} is GOOD: ${value.toFixed(2)}`);
        }
    }

    sendMetrics() {
        // Send to backend analytics
        if (window.JoBikaAPI) {
            window.JoBikaAPI.logPerformance(this.metrics).catch(e => {
                // console.error('Failed to log performance:', e);
            });
        }

        // console.log('Performance Metrics:', this.metrics);
    }

    getMetrics() {
        return this.metrics;
    }
}

/**
 * Image Optimization & Lazy Loading
 */
class ImageOptimizer {
    constructor() {
        this.observer = null;
        this.setupLazyLoading();
    }

    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        this.loadImage(img);
                        this.observer.unobserve(img);
                    }
                });
            }, {
                rootMargin: '50px' // Start loading 50px before visible
            });

            this.observeImages();
        } else {
            // Fallback: load all images immediately
            document.querySelectorAll('img[data-src]').forEach(img => {
                this.loadImage(img);
            });
        }
    }

    observeImages() {
        document.querySelectorAll('img[data-src]').forEach(img => {
            this.observer.observe(img);
        });
    }

    loadImage(img) {
        const src = img.dataset.src;
        if (!src) return;

        // Show loading placeholder
        img.style.opacity = '0.5';

        const tempImg = new Image();
        tempImg.onload = () => {
            img.src = src;
            img.style.opacity = '1';
            img.classList.add('loaded');
        };
        tempImg.onerror = () => {
            img.src = '/assets/images/placeholder.png'; // Fallback
            img.classList.add('error');
        };
        tempImg.src = src;
    }

    optimize(imgElement, options = {}) {
        const { maxWidth = 1920, quality = 0.8 } = options;

        // For future: implement client-side compression
        // For now, just ensure proper attributes
        if (!imgElement.loading) {
            imgElement.loading = 'lazy';
        }

        if (!imgElement.decoding) {
            imgElement.decoding = 'async';
        }
    }
}

/**
 * Debounce & Throttle Utilities
 */
function debounce(func, wait = 300) {
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

function throttle(func, limit = 100) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Memory Leak Prevention
 */
class ResourceCleanup {
    constructor() {
        this.listeners = [];
        this.timers = [];
        this.observers = [];
    }

    addEventListener(element, event, handler, options) {
        element.addEventListener(event, handler, options);
        this.listeners.push({ element, event, handler, options });
    }

    setTimeout(callback, delay) {
        const id = setTimeout(callback, delay);
        this.timers.push(id);
        return id;
    }

    setInterval(callback, delay) {
        const id = setInterval(callback, delay);
        this.timers.push(id);
        return id;
    }

    observe(observer, target, options) {
        observer.observe(target, options);
        this.observers.push({ observer, target });
    }

    cleanup() {
        // Remove event listeners
        this.listeners.forEach(({ element, event, handler, options }) => {
            element.removeEventListener(event, handler, options);
        });
        this.listeners = [];

        // Clear timers
        this.timers.forEach(id => {
            clearTimeout(id);
            clearInterval(id);
        });
        this.timers = [];

        // Disconnect observers
        this.observers.forEach(({ observer }) => {
            observer.disconnect();
        });
        this.observers = [];
    }
}

/**
 * Bundle Size Analysis (Dev Tool)
 */
function analyzeBundleSize() {
    if (performance && performance.getEntriesByType) {
        const resources = performance.getEntriesByType('resource');

        const scripts = resources.filter(r => r.name.endsWith('.js'));
        const styles = resources.filter(r => r.name.endsWith('.css'));
        const images = resources.filter(r => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(r.name));

        const totalSize = resources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
        const scriptSize = scripts.reduce((sum, r) => sum + (r.transferSize || 0), 0);
        const styleSize = styles.reduce((sum, r) => sum + (r.transferSize || 0), 0);
        const imageSize = images.reduce((sum, r) => sum + (r.transferSize || 0), 0);

        console.table({
            'Total': `${(totalSize / 1024).toFixed(2)} KB`,
            'Scripts': `${(scriptSize / 1024).toFixed(2)} KB (${scripts.length} files)`,
            'Styles': `${(styleSize / 1024).toFixed(2)} KB (${styles.length} files)`,
            'Images': `${(imageSize / 1024).toFixed(2)} KB (${images.length} files)`
        });

        // Warn if bundle is too large
        if (scriptSize > 300 * 1024) {
            console.warn('⚠️ JavaScript bundle is large (>300KB). Consider code splitting.');
        }
    }
}

// Initialize
const perfMonitor = new PerformanceMonitor();
const imageOptimizer = new ImageOptimizer();

// Export
window.PerformanceMonitor = perfMonitor;
window.ImageOptimizer = imageOptimizer;
window.debounce = debounce;
window.throttle = throttle;
window.ResourceCleanup = ResourceCleanup;
window.analyzeBundleSize = analyzeBundleSize;
