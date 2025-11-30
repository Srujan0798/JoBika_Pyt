class Analytics {
    static init() {
        // console.log('[Analytics] Initialized');
        // In a real app, we would init Mixpanel/GA here
        // mixpanel.init(process.env.MIXPANEL_TOKEN);
    }

    static async track(eventName, properties = {}) {
        const payload = {
            eventName,
            properties: {
                ...properties,
                timestamp: new Date().toISOString(),
                url: window.location.href,
                userAgent: navigator.userAgent
            }
        };

        // 1. Log to Console (for debugging)
        // console.log(`[Analytics] Track: ${eventName}`, payload);

        // 2. Send to Backend
        try {
            await fetch(`${API_BASE_URL}/analytics/event`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
        } catch (error) {
            console.error('[Analytics] Failed to send event:', error);
        }
    }

    static identify(userId, traits = {}) {
        // console.log(`[Analytics] Identify: ${userId}`, traits);
        this.track('user_identified', { userId, ...traits });
    }

    static trackPageView(pageName) {
        this.track('page_viewed', { page: pageName });
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    Analytics.init();
    Analytics.trackPageView(document.title);
});

// Expose to window
window.Analytics = Analytics;
