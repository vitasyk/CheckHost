/**
 * Simple in-memory rate limiter
 */
export interface RateLimitOptions {
    interval: number; // Time window in milliseconds
    uniqueTokenPerInterval: number; // Max users in the map
}

export function rateLimit(options: RateLimitOptions) {
    const tokenCache = new Map();

    return {
        check: (res: any, limit: number, token: string) => {
            const now = Date.now();
            const tokenCount = tokenCache.get(token) || [0];

            if (tokenCount[0] === 0 || now - tokenCount[1] > options.interval) {
                tokenCount[0] = 1;
                tokenCount[1] = now;
            } else {
                tokenCount[0] += 1;
            }

            tokenCache.set(token, tokenCount);

            // Cleanup oldest entries if cache is too large
            if (tokenCache.size > options.uniqueTokenPerInterval) {
                const oldestToken = tokenCache.keys().next().value;
                tokenCache.delete(oldestToken);
            }

            const isRateLimited = tokenCount[0] > limit;

            return {
                isRateLimited,
                current: tokenCount[0],
                limit,
                remaining: isRateLimited ? 0 : limit - tokenCount[0],
            };
        },
    };
}

// Pre-defined limiters
export const diagnosticLimiter = rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 500,
});

export const generalLimiter = rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 500,
});
