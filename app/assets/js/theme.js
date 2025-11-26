/**
 * JoBika Theme Manager
 * Handles dark mode toggle and persistence
 */

class ThemeManager {
    constructor() {
        this.theme = this.getStoredTheme() || this.getPreferredTheme();
        this.init();
    }

    init() {
        // Apply theme on load
        this.applyTheme(this.theme);

        // Create toggle button
        this.createToggleButton();

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!this.getStoredTheme()) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    getPreferredTheme() {
        // Check system preference
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    getStoredTheme() {
        return localStorage.getItem('theme');
    }

    setTheme(theme) {
        this.theme = theme;
        this.applyTheme(theme);
        localStorage.setItem('theme', theme);
    }

    applyTheme(theme) {
        // Add transition class
        document.body.classList.add('theme-changing');

        // Apply theme
        document.documentElement.setAttribute('data-theme', theme);

        // Update toggle button icon
        this.updateToggleIcon(theme);

        // Remove transition class after animation
        setTimeout(() => {
            document.body.classList.remove('theme-changing');
        }, 300);
    }

    toggleTheme() {
        const newTheme = this.theme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    createToggleButton() {
        const button = document.createElement('button');
        button.className = 'theme-toggle';
        button.setAttribute('aria-label', 'Toggle theme');
        button.setAttribute('title', 'Toggle dark mode');
        button.innerHTML = this.theme === 'dark' ? '☀️' : '🌙';

        button.addEventListener('click', () => this.toggleTheme());

        document.body.appendChild(button);
        this.toggleButton = button;
    }

    updateToggleIcon(theme) {
        if (this.toggleButton) {
            this.toggleButton.innerHTML = theme === 'dark' ? '☀️' : '🌙';
        }
    }
}

// Initialize theme manager
const themeManager = new ThemeManager();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { themeManager, ThemeManager };
}
