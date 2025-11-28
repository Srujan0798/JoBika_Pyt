/**
 * Session Manager for Guest Mode
 * Handles temporary data storage and authentication state
 */

class SessionManager {
    constructor() {
        this.isGuest = !this.hasAuthToken();
        this.guestDataKey = 'jobika_guest_data';
    }

    /**
     * Check if user is logged in
     */
    hasAuthToken() {
        return localStorage.getItem('auth_token') !== null;
    }

    /**
     * Get current user ID from token
     */
    getUserId() {
        const token = localStorage.getItem('auth_token');
        if (!token) return null;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.user_id;
        } catch (e) {
            return null;
        }
    }

    /**
     * Store guest data temporarily (disappears when tab closes)
     */
    setGuestData(key, value) {
        const guestData = this.getAllGuestData();
        guestData[key] = value;
        sessionStorage.setItem(this.guestDataKey, JSON.stringify(guestData));
    }

    /**
     * Get specific guest data
     */
    getGuestData(key) {
        const guestData = this.getAllGuestData();
        return guestData[key] || null;
    }

    /**
     * Get all guest data
     */
    getAllGuestData() {
        const data = sessionStorage.getItem(this.guestDataKey);
        return data ? JSON.parse(data) : {};
    }

    /**
     * Clear all guest data
     */
    clearGuestData() {
        sessionStorage.removeItem(this.guestDataKey);
    }

    /**
     * Show login prompt modal
     */
    showLoginPrompt(feature) {
        const modal = document.getElementById('loginPromptModal');
        const featureName = document.getElementById('featureName');

        if (modal && featureName) {
            featureName.textContent = feature;
            modal.style.display = 'flex';
        }
    }

    /**
     * Hide login prompt modal
     */
    hideLoginPrompt() {
        const modal = document.getElementById('loginPromptModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * Migrate guest data to user account after login
     */
    async migrateGuestData() {
        if (this.isGuest) return;

        const guestData = this.getAllGuestData();
        if (Object.keys(guestData).length === 0) return;

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/auth/migrate-guest-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    guestResume: guestData.resume,
                    guestJobs: guestData.savedJobs || []
                })
            });

            if (response.ok) {
                console.log('✅ Guest data migrated successfully');
                this.clearGuestData();
            }
        } catch (error) {
            console.error('Failed to migrate guest data:', error);
        }
    }

    /**
     * Show guest mode banner
     */
    showGuestBanner() {
        if (!this.isGuest) return;

        const banner = document.createElement('div');
        banner.className = 'guest-banner';
        banner.innerHTML = `
            <div class="guest-banner-content">
                <span class="guest-icon">🎭</span>
                <span class="guest-text">You're in Guest Mode. Your data will be lost when you close this tab.</span>
                <button class="guest-login-btn" onclick="window.location.href='/auth.html'">
                    Login to Save
                </button>
                <button class="guest-close-btn" onclick="this.parentElement.parentElement.remove()">
                    ×
                </button>
            </div>
        `;

        document.body.insertBefore(banner, document.body.firstChild);
    }

    /**
     * Check if feature requires login
     */
    requiresLogin(feature) {
        const loginRequiredFeatures = [
            'save_job',
            'track_application',
            'job_alerts',
            'resume_versions',
            'export_pdf',
            'application_history'
        ];

        return loginRequiredFeatures.includes(feature);
    }

    /**
     * Handle feature access
     */
    async accessFeature(feature, callback) {
        if (this.requiresLogin(feature) && this.isGuest) {
            this.showLoginPrompt(this.getFeatureName(feature));
            return false;
        }

        if (callback) {
            await callback();
        }
        return true;
    }

    /**
     * Get human-readable feature name
     */
    getFeatureName(feature) {
        const names = {
            'save_job': 'Save Job',
            'track_application': 'Track Application',
            'job_alerts': 'Job Alerts',
            'resume_versions': 'Resume Versions',
            'export_pdf': 'Export PDF',
            'application_history': 'Application History'
        };
        return names[feature] || feature;
    }
}

// Initialize global session manager
const sessionManager = new SessionManager();

// Show guest banner on page load
document.addEventListener('DOMContentLoaded', () => {
    sessionManager.showGuestBanner();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SessionManager;
}
