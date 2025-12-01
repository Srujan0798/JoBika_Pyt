class CacheService {
    constructor() {
        this.cache = new Map();
        this.ttl = 5 * 60 * 1000; // 5 minutes default TTL
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }

        return item.value;
    }

    set(key, value, ttl = this.ttl) {
        this.cache.set(key, {
            value,
            expiry: Date.now() + ttl
        });
    }

    del(key) {
        this.cache.delete(key);
    }

    flush() {
        this.cache.clear();
    }
}

module.exports = new CacheService();
