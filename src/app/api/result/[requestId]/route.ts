
import { NextResponse } from 'next/server';
import axios from 'axios';
import { apiLogger } from '@/lib/api-logger';
import { memoryCache } from '@/lib/cache';

export async function GET(
    request: Request,
    context: { params: Promise<{ requestId: string }> }
) {
    const { requestId } = await context.params;

    // 1. Check cache first (TTL 5 minutes for finalized results)
    // DISABLED: Diagnostics should be real-time. We only use memoryCache for de-duplication.
    // const cacheKey = `result:${requestId}`;
    // const cachedData = memoryCache.get(cacheKey);
    // if (cachedData) {
    //     return NextResponse.json(cachedData, { headers: { 'X-Cache': 'HIT' } });
    // }
    const cacheKey = `result:${requestId}`;

    const url = `https://check-host.net/check-result/${requestId}`;
    const startTime = Date.now();

    try {
        const response = await axios.get(url, {
            headers: {
                Accept: 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
            timeout: 10000
        });

        const data = response.data;
        const duration = Date.now() - startTime;

        await apiLogger.logApiUsage({
            api_endpoint: '/result',
            response_time_ms: duration,
            status_code: 200
        });

        const resultValues = Object.values(data || {});
        const hasResults = resultValues.length > 0;

        // We no longer cache "complete" results for long periods (300s) to allow real-time diagnostics.
        // We only keep very short-term cache (2s) to handle polling concurrency.
        if (hasResults) {
            memoryCache.set(cacheKey, data, 2);
        }

        return NextResponse.json(data, {
            headers: { 'X-Cache': 'MISS' }
        });
    } catch (error) {
        const duration = Date.now() - startTime;
        let statusCode = 500;
        if (axios.isAxiosError(error) && error.response) {
            statusCode = error.response.status;
        }

        await apiLogger.logApiUsage({
            api_endpoint: '/result',
            response_time_ms: duration,
            status_code: statusCode
        });

        if (axios.isAxiosError(error) && error.response) {
            return NextResponse.json(error.response.data || { error: 'Upstream error' }, { status: error.response.status });
        }
        return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 });
    }
}
