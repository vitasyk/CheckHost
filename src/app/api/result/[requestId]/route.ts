
import { NextResponse } from 'next/server';
import axios from 'axios';
import { apiLogger } from '@/lib/api-logger';

function sanitizeId(id: string): string {
    return id.replace('.node.check-host.net', '');
}

function sanitizeKeys(obj: Record<string, any>): Record<string, any> {
    if (!obj) return obj;
    return Object.keys(obj).reduce((acc, key) => {
        acc[sanitizeId(key)] = obj[key];
        return acc;
    }, {} as Record<string, any>);
}

export async function GET(
    request: Request,
    context: { params: Promise<{ requestId: string }> }
) {
    const { requestId } = await context.params;
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

        const duration = Date.now() - startTime;
        await apiLogger.logApiUsage({
            api_endpoint: '/result',
            response_time_ms: duration,
            status_code: 200
        });

        // Sanitize keys (node IDs)
        const data = sanitizeKeys(response.data);

        return NextResponse.json(data);
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
