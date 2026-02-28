import { Redis as UpstashRedis } from '@upstash/redis';
import Redis from 'ioredis';

/**
 * Universal Redis Client
 * Automatically uses Upstash REST API if configured,
 * otherwise falls back to a traditional Redis TCP connection (e.g. Local Docker).
 */

class UniversalRedis {
    private client: UpstashRedis | Redis | null = null;
    private isUpstash = false;

    constructor() {
        // We only initialize on the server side
        if (typeof window !== 'undefined') return;

        const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
        const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
        const localUrl = process.env.REDIS_URL;

        if (upstashUrl && upstashToken) {
            this.client = new UpstashRedis({
                url: upstashUrl,
                token: upstashToken,
            });
            this.isUpstash = true;
            console.log('[Redis] Initialized Upstash REST Client');
        } else if (localUrl) {
            this.client = new Redis(localUrl);
            this.isUpstash = false;
            console.log('[Redis] Initialized Local TCP Client (ioredis)');
        } else {
            console.warn('[Redis] No configuration found. UniversalRedis is disabled.');
        }
    }

    /**
     * Check if Redis connection is active
     */
    public get isEnabled(): boolean {
        return this.client !== null;
    }

    /**
     * Get a key
     */
    async get<T>(key: string): Promise<T | null> {
        if (!this.client) return null;
        try {
            if (this.isUpstash) {
                return await (this.client as UpstashRedis).get<T>(key);
            } else {
                const data = await (this.client as Redis).get(key);
                return data ? JSON.parse(data) : null;
            }
        } catch (error) {
            console.error('[Redis Error GET]', error);
            return null;
        }
    }

    /**
     * Set a key with expiration (in seconds)
     */
    async set(key: string, value: any, exSeconds?: number): Promise<'OK' | null> {
        if (!this.client) return null;
        try {
            if (this.isUpstash) {
                return await (this.client as UpstashRedis).set(key, value, exSeconds ? { ex: exSeconds } : undefined);
            } else {
                const strValue = JSON.stringify(value);
                if (exSeconds) {
                    return await (this.client as Redis).set(key, strValue, 'EX', exSeconds);
                }
                return await (this.client as Redis).set(key, strValue);
            }
        } catch (error) {
            console.error('[Redis Error SET]', error);
            return null;
        }
    }

    /**
     * Increment a counter
     */
    async incr(key: string): Promise<number | null> {
        if (!this.client) return null;
        try {
            return await this.client.incr(key);
        } catch (error) {
            console.error('[Redis Error INCR]', error);
            return null;
        }
    }

    /**
     * Set expiration for a specific key
     */
    async expire(key: string, exSeconds: number): Promise<boolean> {
        if (!this.client) return false;
        try {
            const result = await this.client.expire(key, exSeconds);
            return result === 1;
        } catch (error) {
            console.error('[Redis Error EXPIRE]', error);
            return false;
        }
    }

    /**
     * Set NX (Set if Not eXists) with expiration.
     * Useful for locks/throttling.
     */
    async setnx(key: string, value: string, exSeconds: number): Promise<boolean> {
        if (!this.client) return false;
        try {
            if (this.isUpstash) {
                const res = await (this.client as UpstashRedis).set(key, value, { nx: true, ex: exSeconds });
                return res === 'OK';
            } else {
                const res = await (this.client as Redis).set(key, value, 'EX', exSeconds, 'NX');
                return res === 'OK';
            }
        } catch (error) {
            console.error('[Redis Error SETNX]', error);
            return false;
        }
    }

    /**
     * Delete a key
     */
    async del(key: string): Promise<number | null> {
        if (!this.client) return null;
        try {
            return await this.client.del(key);
        } catch (error) {
            console.error('[Redis Error DEL]', error);
            return null;
        }
    }
}

const globalForRedis = globalThis as unknown as {
    redis: UniversalRedis | undefined;
};

export const redis = globalForRedis.redis ?? new UniversalRedis();

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;
