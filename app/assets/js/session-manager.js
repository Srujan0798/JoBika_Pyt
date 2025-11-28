/**
 * Session Manager for Guest Mode
 * Handles temporary data storage, authentication state, and global auth modal
 */

class SessionManager {
    constructor() {
        this.isGuest = !this.hasAuthToken();
        this.guestDataKey = 'jobika_guest_data';
        this.initAuthModal();
    }

    /**
     * Initialize Auth Modal
     */
    async initAuthModal() {
        if (document.getElementById('globalAuthModal')) return;

        try {
            const response = await fetch('components/auth-modal.html');
            if (response.ok) {
                const html = await response.text();
                document.body.insertAdjacentHTML('beforeend', html);
            }
        } catch (error) {
            console.error('Failed to load auth modal:', error);
        }
    }

    /**
     * Check if user is logged in
     */
    hasAuthToken() {
        return localStorage.getItem('auth_token') !== null;
    }

    /**
     * Show Auth Modal
     * @param {string} mode - 'login' or 'register'
     */
    showAuthModal(mode = 'login') {
        const modal = document.getElementById('globalAuthModal');
        if (modal) {
            modal.style.display = 'flex';
            this.switchAuthTab(mode);
        }
    }

    /**
     * Hide Auth Modal
     */
    hideAuthModal() {
        const modal = document.getElementById('globalAuthModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * Switch between Login and Register tabs
     */
    switchAuthTab(mode) {
        const loginForm = document.getElementById('authModalLogin');
        const registerForm = document.getElementById('authModalRegister');
        const tabs = document.querySelectorAll('.auth-tab');

        if (mode === 'login') {
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
            tabs[0].classList.add('active');
            tabs[1].classList.remove('active');
        } else {
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
            tabs[0].classList.remove('active');
            tabs[1].classList.add('active');
        }
    }

    /**
     * Handle Modal Login
     */
    async handleModalLogin(event) {
        event.preventDefault();
        const form = event.target;
        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.textContent;

        btn.disabled = true;
        btn.textContent = 'Signing in...';

        try {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                localStorage.setItem('auth_token', result.token);
                localStorage.setItem('user_data', JSON.stringify(result.user));

                // Migrate guest data
                await this.migrateGuestData();

                // Reload page to reflect login state
                window.location.reload();
            } else {
                alert(result.error || 'Login failed');
            }
        } catch (error) {
            alert('Login failed: ' + error.message);
        } finally {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    }

    /**
     * Handle Modal Register
     */
    async handleModalRegister(event) {
        event.preventDefault();
        const form = event.target;
        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.textContent;

        btn.disabled = true;
        btn.textContent = 'Creating account...';

        try {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                localStorage.setItem('auth_token', result.token);
                localStorage.setItem('user_data', JSON.stringify(result.user));

                // Migrate guest data
                await this.migrateGuestData();

                // Reload page
                window.location.reload();
            } else {
                alert(result.error || 'Registration failed');
            }
        } catch (error) {
            alert('Registration failed: ' + error.message);
        } finally {
            btn.disabled = false;
            btn.textContent = originalText;
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
                <button class="guest-login-btn" onclick="sessionManager.showAuthModal('register')">
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
            this.showAuthModal('login');
            return false;
        }

        if (callback) {
            await callback();
        }
        return true;
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
