// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Global app state
const AppState = {
    user: null,
    token: null,
    resume: null,
    jobs: [],
    applications: []
};

// API Helper Functions
async function apiCall(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (AppState.token) {
        headers['Authorization'] = `Bearer ${AppState.token}`;
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'API request failed');
        }

        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Initialize app
function initApp() {
    // Load from localStorage
    const token = localStorage.getItem('jobika_token');
    const user = localStorage.getItem('jobika_user');

    if (token && user) {
        AppState.token = token;
        AppState.user = JSON.parse(user);
    }

    // Load data if logged in
    if (AppState.token) {
        loadJobs();
        loadApplications();
        loadAnalytics();
    }
}

// Authentication Functions
async function register(email, password, fullName) {
    try {
        const data = await apiCall('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, fullName })
        });

        AppState.token = data.token;
        AppState.user = data.user;

        localStorage.setItem('jobika_token', data.token);
        localStorage.setItem('jobika_user', JSON.stringify(data.user));

        return data;
    } catch (error) {
        alert('Registration failed: ' + error.message);
        throw error;
    }
}

async function login(email, password, twoFactorCode = null) {
    try {
        const body = { email, password };
        if (twoFactorCode) {
            body.twoFactorCode = twoFactorCode;
        }

        const data = await apiCall('/auth/login', {
            method: 'POST',
            body: JSON.stringify(body)
        });

        // Handle 2FA challenge
        if (data.require2fa) {
            return { require2fa: true };
        }

        AppState.token = data.token;
        AppState.user = data.user;

        localStorage.setItem('jobika_token', data.token);
        localStorage.setItem('jobika_user', JSON.stringify(data.user));

        return data;
    } catch (error) {
        alert('Login failed: ' + error.message);
        throw error;
    }
}

function logout() {
    AppState.token = null;
    AppState.user = null;
    localStorage.clear();
    window.location.href = 'index.html';
}

// Resume Functions
async function uploadResume(file) {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(`${API_BASE_URL}/resume/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AppState.token}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error('Upload failed');
        }

        const data = await response.json();
        AppState.resume = data;
        localStorage.setItem('jobika_resume', JSON.stringify(data));

        return data;
    } catch (error) {
        alert('Resume upload failed: ' + error.message);
        throw error;
    }
}

async function getResume(resumeId) {
    try {
        const data = await apiCall(`/resume/${resumeId}`);
        AppState.resume = data;
        return data;
    } catch (error) {
        console.error('Failed to get resume:', error);
        return null;
    }
}

// Job Functions
async function loadJobs(filters = {}) {
    try {
        const params = new URLSearchParams(filters);
        const data = await apiCall(`/jobs?${params}`);
        AppState.jobs = data;
        return data;
    } catch (error) {
        console.error('Failed to load jobs:', error);
        // Fallback to mock data if API fails
        loadMockJobs();
        return AppState.jobs;
    }
}

async function getJob(jobId) {
    try {
        return await apiCall(`/jobs/${jobId}`);
    } catch (error) {
        console.error('Failed to get job:', error);
        return null;
    }
}

async function searchJobs(query, filters = {}) {
    try {
        const params = new URLSearchParams({ ...filters, q: query });
        const data = await apiCall(`/jobs?${params}`);
        AppState.jobs = data;
        return data;
    } catch (error) {
        console.error('Job search failed:', error);
        return [];
    }
}

// Application Functions
async function createApplication(jobId) {
    try {
        const data = await apiCall('/applications', {
            method: 'POST',
            body: JSON.stringify({ jobId })
        });

        // Reload applications
        await loadApplications();

        return data;
    } catch (error) {
        alert('Failed to create application: ' + error.message);
        throw error;
    }
}

async function loadApplications() {
    try {
        const data = await apiCall('/applications');
        AppState.applications = data;
        return data;
    } catch (error) {
        console.error('Failed to load applications:', error);
        // Fallback to mock data
        loadMockApplications();
        return AppState.applications;
    }
}

async function loadAnalytics() {
    try {
        const data = await apiCall('/analytics');
        renderAnalytics(data);
        return data;
    } catch (error) {
        console.error('Failed to load analytics:', error);
        // Fallback UI
        document.getElementById('analytics-chart').innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400">No data available</div>';
        document.getElementById('market-insights').innerHTML = '<div class="w-full text-center text-gray-400">No insights available</div>';
    }
}

function renderAnalytics(data) {
    // Render User Stats
    if (data.userStats) {
        document.getElementById('total-applications').textContent = data.userStats.total || 0;

        // Calculate response rate (interviews / applications)
        const interviews = data.userStats.breakdown?.interview || 0;
        const offers = data.userStats.breakdown?.offer || 0;
        const total = data.userStats.total || 1;
        const rate = Math.round(((interviews + offers) / total) * 100);

        document.getElementById('total-interviews').textContent = interviews;
        document.getElementById('total-offers').textContent = offers;
        document.getElementById('response-rate').textContent = `${rate}%`;

        // Render Chart (Simple CSS Bars)
        const chartContainer = document.getElementById('analytics-chart');
        if (data.userStats.timeline && data.userStats.timeline.counts.length > 0) {
            const maxCount = Math.max(...data.userStats.timeline.counts, 1);

            chartContainer.innerHTML = data.userStats.timeline.counts.map((count, index) => {
                const height = (count / maxCount) * 100;
                const date = new Date(data.userStats.timeline.dates[index]).toLocaleDateString('en-US', { weekday: 'short' });
                return `
                    <div class="flex flex-col items-center flex-1 group">
                        <div class="w-full bg-blue-100 rounded-t-sm relative hover:bg-blue-200 transition-all" style="height: ${height}%">
                            <div class="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                ${count} apps
                            </div>
                        </div>
                        <div class="text-xs text-gray-500 mt-2">${date}</div>
                    </div>
                `;
            }).join('');
        }
    }

    // Render Market Insights
    if (data.marketInsights && data.marketInsights.top_skills) {
        const insightsContainer = document.getElementById('market-insights');
        const maxCount = Math.max(...data.marketInsights.top_skills.map(s => s.count), 1);

        insightsContainer.innerHTML = data.marketInsights.top_skills.map(skill => {
            const width = (skill.count / maxCount) * 100;
            return `
                <div>
                    <div class="flex justify-between text-sm mb-1">
                        <span class="font-medium text-gray-700">${skill.name}</span>
                        <span class="text-gray-500">${skill.count} jobs</span>
                    </div>
                    <div class="w-full bg-gray-100 rounded-full h-2">
                        <div class="bg-blue-600 h-2 rounded-full" style="width: ${width}%"></div>
                    </div>
                </div>
            `;
        }).join('');
    }
}

// Fallback Mock Data (for when backend is not running)
function loadMockJobs() {
    AppState.jobs = [
        {
            id: 1,
            title: 'Senior Full-Stack Developer',
            company: 'Google India',
            location: 'Bangalore',
            salary: '₹25-35 LPA',
            matchScore: 92,
            skills: ['React', 'Node.js', 'TypeScript', 'AWS'],
            posted: '2 days ago'
        },
        {
            id: 2,
            title: 'AI/ML Engineer',
            company: 'Microsoft',
            location: 'Hyderabad',
            salary: '₹30-40 LPA',
            matchScore: 78,
            skills: ['Python', 'TensorFlow', 'PyTorch', 'ML'],
            posted: '1 week ago'
        },
        {
            id: 3,
            title: 'Frontend Developer',
            company: 'Flipkart',
            location: 'Bangalore',
            salary: '₹15-20 LPA',
            matchScore: 88,
            skills: ['React', 'JavaScript', 'CSS', 'Redux'],
            posted: '3 days ago'
        },
        {
            id: 4,
            title: 'Backend Engineer',
            company: 'Amazon',
            location: 'Mumbai',
            salary: '₹20-28 LPA',
            matchScore: 85,
            skills: ['Java', 'Spring Boot', 'Microservices', 'AWS'],
            posted: '5 days ago'
        },
        {
            id: 5,
            title: 'DevOps Engineer',
            company: 'Zomato',
            location: 'Gurugram',
            salary: '₹18-25 LPA',
            matchScore: 72,
            skills: ['Docker', 'Kubernetes', 'CI/CD', 'AWS'],
            posted: '1 week ago'
        },
        {
            id: 6,
            title: 'Data Scientist',
            company: 'Swiggy',
            location: 'Bangalore',
            salary: '₹22-30 LPA',
            matchScore: 68,
            skills: ['Python', 'SQL', 'Machine Learning', 'Statistics'],
            posted: '4 days ago'
        }
    ];
}

function loadMockApplications() {
    AppState.applications = [
        {
            id: 1,
            jobId: 1,
            status: 'interview',
            appliedDate: '2025-11-20',
            company: 'Google India',
            position: 'Senior Full-Stack Developer',
            matchScore: 92
        },
        {
            id: 2,
            jobId: 3,
            status: 'under_review',
            appliedDate: '2025-11-22',
            company: 'Flipkart',
            position: 'Frontend Developer',
            matchScore: 88
        },
        {
            id: 3,
            jobId: 4,
            status: 'applied',
            appliedDate: '2025-11-24',
            company: 'Amazon',
            position: 'Backend Engineer',
            matchScore: 85
        }
    ];
}

// Helper functions
function getMatchScoreClass(score) {
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-IN', options);
}

function isLoggedIn() {
    return !!AppState.token;
}

function requireAuth() {
    if (!isLoggedIn()) {
        window.location.href = 'auth.html';
        return false;
    }
    return true;
}

// Notification Functions
async function loadNotifications() {
    try {
        const notifications = await apiCall('/notifications');
        renderNotifications(notifications);
        return notifications;
    } catch (error) {
        console.error('Failed to load notifications:', error);
    }
}

function renderNotifications(notifications) {
    const list = document.getElementById('notification-list');
    const badge = document.getElementById('notification-badge');

    if (!list || !badge) return;

    const unreadCount = notifications.filter(n => !n.isRead).length;

    // Update badge
    if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }

    // Render list
    if (notifications.length === 0) {
        list.innerHTML = '<div class="p-4 text-center text-gray-500 text-sm">No notifications</div>';
        return;
    }

    list.innerHTML = notifications.map(n => `
        <div class="p-4 border-b border-gray-50 hover:bg-gray-50 ${n.isRead ? 'opacity-60' : 'bg-blue-50'}">
            <div class="flex justify-between items-start mb-1">
                <h4 class="text-sm font-semibold text-gray-800">${n.title}</h4>
                <span class="text-xs text-gray-400">${new Date(n.createdAt).toLocaleDateString()}</span>
            </div>
            <p class="text-sm text-gray-600">${n.message}</p>
        </div>
    `).join('');
}

function toggleNotifications() {
    const dropdown = document.getElementById('notification-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('hidden');
    }
}

async function markAllRead() {
    try {
        await apiCall('/notifications/mark-read', { method: 'POST' });
        loadNotifications(); // Reload to update UI
    } catch (error) {
        console.error('Failed to mark read:', error);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initApp();

    // Poll for notifications every minute
    if (isLoggedIn()) {
        loadNotifications();
        setInterval(loadNotifications, 60000);
    }
});

// Export for use in other files
window.JoBikaAPI = {
    register,
    login,
    logout,
    uploadResume,
    getResume,
    loadJobs,
    getJob,
    searchJobs,
    createApplication,
    loadApplications,
    isLoggedIn,
    requireAuth,
    getState: () => AppState,
    toggleNotifications,
    markAllRead
};
