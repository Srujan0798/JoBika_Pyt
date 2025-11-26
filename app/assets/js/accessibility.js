/**
 * JoBika Accessibility Enhancements
 * Improves keyboard navigation and screen reader support
 */

(function () {
    'use strict';

    // Add skip to main content link
    function addSkipLink() {
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.className = 'skip-link';
        skipLink.textContent = 'Skip to main content';
        skipLink.style.cssText = `
            position: absolute;
            top: -40px;
            left: 0;
            background: var(--primary-blue);
            color: white;
            padding: 8px;
            text-decoration: none;
            z-index: 10000;
        `;

        skipLink.addEventListener('focus', function () {
            this.style.top = '0';
        });

        skipLink.addEventListener('blur', function () {
            this.style.top = '-40px';
        });

        document.body.insertBefore(skipLink, document.body.firstChild);

        // Add id to main content if not exists
        const main = document.querySelector('main') || document.querySelector('[role="main"]');
        if (main && !main.id) {
            main.id = 'main-content';
            main.setAttribute('tabindex', '-1');
        }
    }

    // Improve focus visibility
    function improveFocusVisibility() {
        const style = document.createElement('style');
        style.textContent = `
            *:focus {
                outline: 3px solid var(--primary-blue);
                outline-offset: 2px;
            }
            
            button:focus,
            a:focus,
            input:focus,
            textarea:focus,
            select:focus {
                outline: 3px solid var(--primary-blue);
                outline-offset: 2px;
            }
            
            .sr-only {
                position: absolute;
                left: -10000px;
                width: 1px;
                height: 1px;
                overflow: hidden;
            }
            
            .high-contrast {
                --primary-blue: #0000ff;
                --primary-purple: #800080;
                --success: #008000;
                --danger: #ff0000;
                --warning: #ffff00;
            }
            
            .high-contrast * {
                border-width: 2px !important;
            }
        `;
        document.head.appendChild(style);
    }

    // Add ARIA labels to interactive elements
    function addAriaLabels() {
        // Buttons without labels
        document.querySelectorAll('button:not([aria-label])').forEach(btn => {
            if (!btn.textContent.trim() && !btn.getAttribute('aria-label')) {
                const icon = btn.querySelector('svg, i, img');
                if (icon) {
                    btn.setAttribute('aria-label', 'Action button');
                }
            }
        });

        // Links without text
        document.querySelectorAll('a:not([aria-label])').forEach(link => {
            if (!link.textContent.trim() && !link.getAttribute('aria-label')) {
                const icon = link.querySelector('svg, i, img');
                if (icon) {
                    link.setAttribute('aria-label', 'Link');
                }
            }
        });

        // Form inputs without labels
        document.querySelectorAll('input:not([aria-label]):not([id])').forEach(input => {
            if (input.placeholder) {
                input.setAttribute('aria-label', input.placeholder);
            }
        });
    }

    // Add keyboard navigation for cards
    function improveCardNavigation() {
        document.querySelectorAll('.job-card, .card').forEach(card => {
            // Make cards focusable if they have click handlers
            if (card.onclick || card.querySelector('a')) {
                if (!card.getAttribute('tabindex')) {
                    card.setAttribute('tabindex', '0');
                }

                // Add keyboard support
                card.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        const link = this.querySelector('a');
                        if (link) {
                            link.click();
                        } else if (this.onclick) {
                            this.click();
                        }
                    }
                });
            }
        });
    }

    // Announce route changes to screen readers
    function announceRouteChanges() {
        const announcer = document.createElement('div');
        announcer.setAttribute('aria-live', 'polite');
        announcer.setAttribute('aria-atomic', 'true');
        announcer.className = 'sr-only';
        announcer.style.cssText = `
            position: absolute;
            left: -10000px;
            width: 1px;
            height: 1px;
            overflow: hidden;
        `;
        document.body.appendChild(announcer);

        // Watch for title changes (simple SPA detection)
        const titleElement = document.querySelector('title');
        if (titleElement) {
            const observer = new MutationObserver(function (mutations) {
                mutations.forEach(function (mutation) {
                    if (mutation.type === 'childList') {
                        const title = document.title;
                        announcer.textContent = `Navigated to ${title}`;
                    }
                });
            });

            observer.observe(titleElement, {
                childList: true
            });
        }
    }

    // Add loading state announcements
    function announceLoadingStates() {
        const observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                mutation.addedNodes.forEach(function (node) {
                    if (node.nodeType === 1) {
                        // Announce spinners
                        if (node.classList && node.classList.contains('spinner')) {
                            node.setAttribute('role', 'status');
                            node.setAttribute('aria-label', 'Loading');
                        }

                        // Announce loading overlays
                        if (node.classList && node.classList.contains('loading-overlay')) {
                            node.setAttribute('role', 'status');
                            node.setAttribute('aria-label', 'Loading content, please wait');
                        }
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Improve modal accessibility
    function improveModalAccessibility() {
        document.addEventListener('DOMContentLoaded', function () {
            document.querySelectorAll('[role="dialog"], .modal').forEach(modal => {
                if (!modal.getAttribute('aria-modal')) {
                    modal.setAttribute('aria-modal', 'true');
                }

                // Trap focus in modal and handle escape
                modal.addEventListener('keydown', function (e) {
                    if (e.key === 'Escape') {
                        const closeBtn = modal.querySelector('[data-dismiss], .close');
                        if (closeBtn) closeBtn.click();
                    }
                });
            });
        });
    }

    // Add high contrast mode support
    function addHighContrastSupport() {
        const mediaQuery = window.matchMedia('(prefers-contrast: high)');

        function applyHighContrast(e) {
            if (e.matches) {
                document.documentElement.classList.add('high-contrast');
            } else {
                document.documentElement.classList.remove('high-contrast');
            }
        }

        applyHighContrast(mediaQuery);
        mediaQuery.addEventListener('change', applyHighContrast);
    }

    // Initialize all accessibility features
    function init() {
        addSkipLink();
        improveFocusVisibility();
        addAriaLabels();
        improveCardNavigation();
        announceRouteChanges();
        announceLoadingStates();
        improveModalAccessibility();
        addHighContrastSupport();

        console.log('✅ Accessibility features initialized');
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
