import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/postgres';

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Fetch total checks count
        const totalChecksRes = await pool.query('SELECT COUNT(*) FROM check_logs');
        const totalChecks = parseInt(totalChecksRes.rows[0].count);

        // Fetch recent logs
        const recentLogsRes = await pool.query(
            'SELECT * FROM check_logs ORDER BY created_at DESC LIMIT 10'
        );
        const recentLogs = recentLogsRes.rows;

        // Calculate API Uptime (simplified: last 24h success rate)
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        const apiMetricsRes = await pool.query(
            'SELECT status_code FROM api_usage_logs WHERE created_at >= $1',
            [dayAgo]
        );
        const apiMetrics = apiMetricsRes.rows;

        const totalRequests = apiMetrics.length;
        const successRequests = apiMetrics.filter((m: any) => m.status_code >= 200 && m.status_code < 300).length;
        const uptime = totalRequests > 0 ? (successRequests / totalRequests) * 100 : 99.99;

        // Count errors (last 24h)
        const errorsRes = await pool.query(
            'SELECT COUNT(*) FROM api_usage_logs WHERE status_code >= 400 AND created_at >= $1',
            [dayAgo]
        );
        const errors = parseInt(errorsRes.rows[0].count);

        return NextResponse.json({
            stats: {
                totalChecks,
                uptime: uptime.toFixed(2),
                errors,
            },
            recentLogs
        });
    } catch (error) {
        console.error('Failed to fetch admin stats:', error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
