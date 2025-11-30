/**
 * @jest-environment jsdom
 */

const { ToastManager, formatDate, debounce, throttle } = require('../../../app/assets/js/utils');

describe('Frontend Utils', () => {
    describe('ToastManager', () => {
        let toast;

        beforeEach(() => {
            document.body.innerHTML = '';
            toast = new ToastManager();
        });

        it('should initialize container', () => {
            const container = document.querySelector('.toast-container');
            expect(container).toBeTruthy();
        });

        it('should show toast message', () => {
            toast.show('Hello World', 'info');
            const toastEl = document.querySelector('.toast');
            expect(toastEl).toBeTruthy();
            expect(toastEl.textContent).toContain('Hello World');
            expect(toastEl.classList.contains('info')).toBe(true);
        });

        it('should remove toast after duration', () => {
            jest.useFakeTimers();
            toast.show('Self Destruct', 'info', 1000);

            const toastEl = document.querySelector('.toast');
            expect(toastEl).toBeTruthy();

            jest.advanceTimersByTime(1000);
            // Class removing should be added
            expect(toastEl.classList.contains('removing')).toBe(true);

            jest.advanceTimersByTime(300);
            // Should be removed from DOM
            expect(document.querySelector('.toast')).toBeNull();

            jest.useRealTimers();
        });
    });

    describe('formatDate', () => {
        it('should format "Just now"', () => {
            const now = new Date().toISOString();
            expect(formatDate(now)).toBe('Just now');
        });

        it('should format minutes ago', () => {
            const fiveMinsAgo = new Date(Date.now() - 5 * 60000).toISOString();
            expect(formatDate(fiveMinsAgo)).toBe('5 minutes ago');
        });
    });
});
