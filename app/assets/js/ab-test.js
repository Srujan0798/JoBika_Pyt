class ABTest {
    static assign(userId, experimentName) {
        // Consistent hashing to assign user to variant
        const hash = this.hashUserId(userId + experimentName);
        const variant = hash % 100;

        if (variant < 33) return 'control';
        if (variant < 66) return 'variant_a';
        return 'variant_b';
    }

    static hashUserId(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }

    static trackExperiment(userId, experimentName, variant, metric, value) {
        if (window.Analytics) {
            window.Analytics.track('ab_test_metric', {
                experiment: experimentName,
                variant,
                metric,
                value,
                userId
            });
        } else {
            // console.log('[ABTest] Analytics not initialized', { experimentName, variant });
        }
    }
}

// Expose to window
window.ABTest = ABTest;
