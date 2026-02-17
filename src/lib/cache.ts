
type CacheItem<T> = {
    data: T;
    expiry: number;
};

class MemoryCache {
    private cache = new Map<string, CacheItem<any>>();
    private inflight = new Map<string, Promise<any>>();

    /**
     * Get item from cache if not expired
     */
    get<T>(key: string): T | null {
        const item = this.cache.get(key);
        if (item && item.expiry > Date.now()) {
            return item.data;
        }
        if (item) this.cache.delete(key);
        return null;
    }

    /**
     * Set item in cache
     */
    set<T>(key: string, data: T, ttlSeconds: number): void {
        this.cache.set(key, {
            data,
            expiry: Date.now() + ttlSeconds * 1000,
        });
    }

    /**
     * Deduplicate in-flight requests
     */
    async deduplicate<T>(key: string, fn: () => Promise<T>): Promise<T> {
        const existing = this.inflight.get(key);
        if (existing) return existing;

        const promise = fn().finally(() => this.inflight.delete(key));
        this.inflight.set(key, promise);
        return promise;
    }

    /**
     * Delete item from cache
     */
    delete(key: string): void {
        this.cache.delete(key);
    }
}

// Global instance for the server process
export const memoryCache = new MemoryCache();
