// JoBika Frontend API Client - REAL Backend Integration
class JoBikaAPI {
    constructor() {
        /**
         * API Configuration
         * Automatically detects environment and uses correct API URL
         */

        // Production API URL
        const API_URL = 'https://jobika-backend-production.up.railway.app';

        // console.log('🔗 API URL:', API_URL);
        this.baseURL = API_URL;
        this.token = localStorage.getItem('jobika_token');
    }

    // Helper method for authenticated requests
    async request(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const response = await fetch(`${this.baseURL}${endpoint}`, {
            ...options,
            headers
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Request failed');
        }

        return response.json();
    }

    // ===== AUTHENTICATION =====

    async register(email, password, name, profileData = {}) {
        const data = await this.request('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, name, profileData })
        });

        if (data.token) {
            this.token = data.token;
            localStorage.setItem('jobika_token', data.token);
            localStorage.setItem('jobika_user', JSON.stringify(data.user));
        }

        return data;
    }

    async login(email, password) {
        const data = await this.request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (data.token) {
            this.token = data.token;
            localStorage.setItem('jobika_token', data.token);
            localStorage.setItem('jobika_user', JSON.stringify(data.user));
        }

        return data;
    }

    logout() {
        this.token = null;
        localStorage.removeItem('jobika_token');
        localStorage.removeItem('jobika_user');
        window.location.href = '/login.html';
    }

    isAuthenticated() {
        return !!this.token;
    }

    getCurrentUser() {
        const user = localStorage.getItem('jobika_user');
        return user ? JSON.parse(user) : null;
    }

    // ===== JOBS =====

    async searchJobs(query, location, limit = 50) {
        return this.request(`/api/jobs?title=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&limit=${limit}`);
    }

    async scrapeJobs(role, location, limit = 20) {
        return this.request('/api/scrape-jobs', {
            method: 'POST',
            body: JSON.stringify({ role, location, limit })
        });
    }

    // ===== APPLICATIONS =====

    async getApplications() {
        return this.request('/api/applications');
    }

    async createApplication(jobData) {
        return this.request('/api/applications', {
            method: 'POST',
            body: JSON.stringify(jobData)
        });
    }

    async updateApplicationStatus(applicationId, status) {
        return this.request(`/api/applications/${applicationId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
    }

    // ===== RESUME TAILORING (CORE FEATURE) =====

    async tailorResume(resumeId, jobId) {
        return this.request('/api/tailor-resume', {
            method: 'POST',
            body: JSON.stringify({ resumeId, jobId })
        });
    }

    async uploadResume(file) {
        const formData = new FormData();
        formData.append('resume', file);

        const response = await fetch(`${this.baseURL}/api/upload-resume`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`
            },
            body: formData
        });

        return response.json();
    }

    // ===== AUTO-APPLY (CORE FEATURE) =====

    async autoApply(jobId, supervised = true) {
        return this.request('/api/auto-apply', {
            method: 'POST',
            body: JSON.stringify({ jobId, supervised })
        });
    }

    async batchAutoApply(minMatchScore = 75, maxApplications = 20, supervised = false) {
        return this.request('/api/batch-auto-apply', {
            method: 'POST',
            body: JSON.stringify({ minMatchScore, maxApplications, supervised })
        });
    }

    // ===== AI COACH (ORION) =====

    async chatWithOrion(message, folder = 'All') {
        return this.request('/api/orion/chat', {
            method: 'POST',
            body: JSON.stringify({ message, folder })
        });
    }

    async getChatHistory(folder = null, limit = 100) {
        const params = new URLSearchParams();
        if (folder) params.append('folder', folder);
        params.append('limit', limit);

        return this.request(`/api/orion/history?${params}`);
    }

    // ===== ATS CHECKER =====

    async checkATS(resumeText) {
        return this.request('/api/ats-check', {
            method: 'POST',
            body: JSON.stringify({ resumeText })
        });
    }

    // ===== ANALYTICS =====

    async getAnalytics() {
        return this.request('/api/analytics');
    }

    // ===== COVER LETTER =====

    async generateCoverLetter(userProfile, jobDescription, companyInfo) {
        return this.request('/api/cover-letter', {
            method: 'POST',
            body: JSON.stringify({ userProfile, jobDescription, companyInfo })
        });
    }

    // ===== INTERVIEW PREP =====

    async getInterviewPrep(jobDescription, companyName, userProfile) {
        return this.request('/api/interview-prep', {
            method: 'POST',
            body: JSON.stringify({ jobDescription, companyName, userProfile })
        });
    }
}

// Global API instance
window.api = new JoBikaAPI();

// UI Helper Functions
const UI = {
    showLoading(message = 'Loading...') {
        const loader = document.createElement('div');
        loader.id = 'global-loader';
        loader.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        loader.innerHTML = `
            <div class="bg-white p-6 rounded-lg shadow-xl">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p class="mt-4 text-gray-700">${message}</p>
            </div>
        `;
        document.body.appendChild(loader);
    },

    hideLoading() {
        const loader = document.getElementById('global-loader');
        if (loader) loader.remove();
    },

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${type === 'success' ? 'bg-green-500' :
            type === 'error' ? 'bg-red-500' :
                'bg-blue-500'
            } text-white`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.remove(), 3000);
    },

    showError(error) {
        this.showToast(error.message || 'An error occurred', 'error');
        console.error(error);
    }
};

// Check authentication on load
document.addEventListener('DOMContentLoaded', () => {
    const publicPages = ['/login.html', '/signup.html', '/index.html', '/'];
    const currentPage = window.location.pathname;

    if (!api.isAuthenticated() && !publicPages.some(page => currentPage.endsWith(page))) {
        window.location.href = '/login.html';
    }

    // Show user info if logged in
    if (api.isAuthenticated()) {
        const user = api.getCurrentUser();
        const userNameElements = document.querySelectorAll('.user-name');
        userNameElements.forEach(el => {
            el.textContent = user.name;
        });
    }
});
