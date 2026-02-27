
import { redis } from './redis';

type CacheItem<T> = {
    data: T;
    expiry: number;
};

class HybridCache {
    private localCache = new Map<string, CacheItem<any>>();
    private inflight = new Map<string, Promise<any>>();

    /**
     * Get item from cache (tries Redis first, then Local Map)
     */
    async get<T>(key: string): Promise<T | null> {
        // 1. Try Redis if enabled
        if (redis.isEnabled) {
            const redisData = await redis.get<T>(key);
            if (redisData !== null) return redisData;
        }

        // 2. Fallback to local memory cache
        const item = this.localCache.get(key);
        if (item && item.expiry > Date.now()) {
            return item.data;
        }
        if (item) this.localCache.delete(key);

        return null;
    }

    /**
     * Set item in cache (Redis and Local Map)
     */
    async set<T>(key: string, data: T, ttlSeconds: number): Promise<void> {
        // Set in Redis
        if (redis.isEnabled) {
            await redis.set(key, data, ttlSeconds);
        }

        // Set in local memory (acts as extremely fast L1 cache or fallback)
        this.localCache.set(key, {
            data,
            expiry: Date.now() + ttlSeconds * 1000,
        });
    }

    /**
     * Deduplicate in-flight requests (kept in memory as it's just per-process promise state)
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
    async delete(key: string): Promise<void> {
        if (redis.isEnabled) {
            await redis.del(key);
        }
        this.localCache.delete(key);
    }
}

// Global instance for the server process (named memoryCache for backward compatibility)
export const memoryCache = new HybridCache();
