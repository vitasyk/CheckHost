
import { NextResponse } from 'next/server';
import axios from 'axios';
import { apiLogger } from '@/lib/api-logger';
import { headers } from 'next/headers';

// Helper to sanitize node IDs
function sanitizeId(id: string): string {
    return id.replace('.node.check-host.net', '');
}

function sanitizeNodes(nodes: Record<string, any>): Record<string, any> {
    if (!nodes) return nodes;
    return Object.keys(nodes).reduce((acc, key) => {
        acc[sanitizeId(key)] = nodes[key];
        return acc;
    }, {} as Record<string, any>);
}

export async function GET(
    request: Request,
    context: { params: Promise<{ type: string }> }
) {
    const { type } = await context.params;
    const { searchParams } = new URL(request.url);

    // Forward to check-host
    // Construct CheckHost URL with original params
    // Note: searchParams.toString() includes 'host', 'max_nodes', 'node' etc.
    const url = `https://check-host.net/check-${type}?${searchParams.toString()}`;

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

        // Logging
        const headerList = await headers();
        const userIp = headerList.get('x-forwarded-for') || '127.0.0.1';

        const checkId = await apiLogger.logCheck({
            check_type: type,
            target_host: searchParams.get('host') || 'unknown',
            user_ip: userIp,
            nodes_count: searchParams.get('max_nodes') ? parseInt(searchParams.get('max_nodes')!) : undefined
        });

        await apiLogger.logApiUsage({
            api_endpoint: `/check/${type}`,
            check_id: checkId || undefined,
            response_time_ms: duration,
            status_code: 200
        });

        // Sanitize nodes in response if present
        if (data && data.nodes) {
            data.nodes = sanitizeNodes(data.nodes);
        }

        // Remove check-host links
        if (data.permanent_link) {
            delete data.permanent_link;
        }

        return NextResponse.json(data);
    } catch (error) {
        const duration = Date.now() - startTime;
        let statusCode = 500;
        let errorMsg = 'Failed to initiate check';

        if (axios.isAxiosError(error) && error.response) {
            statusCode = error.response.status;
            errorMsg = error.response.data?.message || 'Upstream error';
        }

        await apiLogger.logApiUsage({
            api_endpoint: `/check/${type}`,
            response_time_ms: duration,
            status_code: statusCode
        });

        return NextResponse.json({ error: errorMsg }, { status: statusCode });
    }
}
