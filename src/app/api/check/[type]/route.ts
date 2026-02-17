
import { NextResponse } from 'next/server';
import axios from 'axios';
import { apiLogger } from '@/lib/api-logger';
import { headers } from 'next/headers';
import { memoryCache } from '@/lib/cache';

export async function GET(
    request: Request,
    context: { params: Promise<{ type: string }> }
) {
    const { type } = await context.params;
    const { searchParams } = new URL(request.url);
    const host = searchParams.get('host') || 'unknown';
    const refresh = searchParams.get('refresh') === 'true';

    // Create a unique cache key based on type, host, and all parameters
    const cacheKey = `initiate:${type}:${searchParams.toString()}`;

    // Diagnostic types that SHOULD NOT be cached (must be real-time)
    const realTimeTypes = ['ping', 'http', 'tcp', 'udp', 'dns', 'mtr'];
    const isRealTime = realTimeTypes.includes(type);

    // 1. Check if we have a recently cached request_id for this exact query (60s TTL)
    // Bypassed if refresh=true OR if it's a real-time diagnostic type
    if (!refresh && !isRealTime) {
        const cachedResponse = memoryCache.get(cacheKey);
        if (cachedResponse) {
            return NextResponse.json(cachedResponse, {
                headers: { 'X-Cache': 'HIT' }
            });
        }
    }

    // 2. Use deduplication to handle concurrent requests for the same target
    try {
        const responseData = await memoryCache.deduplicate(cacheKey, async () => {
            // Forward to check-host
            const url = `https://check-host.net/check-${type}?${searchParams.toString()}`;

            const startTime = Date.now();
            const response = await axios.get(url, {
                headers: {
                    Accept: 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                },
                timeout: 10000
            });

            const data = response.data;
            const duration = Date.now() - startTime;

            // Logging
            const headerList = await headers();
            const userIp = headerList.get('x-forwarded-for') || '127.0.0.1';

            const checkId = await apiLogger.logCheck({
                check_type: type,
                target_host: host,
                user_ip: userIp,
                nodes_count: searchParams.get('max_nodes') ? parseInt(searchParams.get('max_nodes')!) : undefined
            });

            await apiLogger.logApiUsage({
                api_endpoint: `/check/${type}`,
                check_id: checkId || undefined,
                response_time_ms: duration,
                status_code: 200
            });

            // Remove check-host links
            if (data.permanent_link) {
                delete data.permanent_link;
            }

            // Cache the successful initiation for 60 seconds
            memoryCache.set(cacheKey, data, 60);

            return data;
        });

        return NextResponse.json(responseData, {
            headers: { 'X-Cache': 'MISS' }
        });
    } catch (error) {
        // Detailed error for initiating check
        let statusCode = 500;
        let errorMsg = 'Failed to initiate check';

        if (axios.isAxiosError(error) && error.response) {
            statusCode = error.response.status;
            errorMsg = error.response.data?.message || 'Upstream error';
        }

        return NextResponse.json({ error: errorMsg }, { status: statusCode });
    }
}
