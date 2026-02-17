import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import pool, { isPostgresConfigured } from '@/lib/postgres';

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        let totalChecks = 0;
        let recentLogs: any[] = [];
        let uptime = "99.99";
        let errors = 0;

        if (isSupabaseConfigured) {
            // Fetch stats from Supabase
            const { count: sbTotalChecks } = await supabase
                .from('check_logs')
                .select('*', { count: 'exact', head: true });

            totalChecks = sbTotalChecks || 0;

            const { data: sbRecentLogs } = await supabase
                .from('check_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);

            recentLogs = sbRecentLogs || [];

            // Calculate API Uptime (last 24h)
            const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const { data: apiMetrics } = await supabase
                .from('api_usage_logs')
                .select('status_code')
                .gte('created_at', dayAgo);

            const totalRequests = apiMetrics?.length || 0;
            const successRequests = apiMetrics?.filter((m: any) => m.status_code >= 200 && m.status_code < 300)?.length || 0;
            uptime = totalRequests > 0 ? ((successRequests / totalRequests) * 100).toFixed(2) : "99.99";

            // Count errors
            const { count: sbErrors } = await supabase
                .from('api_usage_logs')
                .select('*', { count: 'exact', head: true })
                .gte('status_code', 400)
                .gte('created_at', dayAgo);

            errors = sbErrors || 0;

            return NextResponse.json({
                stats: { totalChecks, uptime, errors },
                recentLogs
            });
        }

        if (isPostgresConfigured) {
            // Fetch total checks count
            const totalChecksRes = await pool.query('SELECT COUNT(*) FROM check_logs');
            totalChecks = parseInt(totalChecksRes.rows[0].count);

            // Fetch recent logs
            const recentLogsRes = await pool.query(
                'SELECT * FROM check_logs ORDER BY created_at DESC LIMIT 10'
            );
            recentLogs = recentLogsRes.rows;

            // Calculate API Uptime (last 24h)
            const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const apiMetricsRes = await pool.query(
                'SELECT status_code FROM api_usage_logs WHERE created_at >= $1',
                [dayAgo]
            );
            const apiMetrics = apiMetricsRes.rows;

            const totalReqs = apiMetrics.length;
            const successReqs = apiMetrics.filter((m: any) => m.status_code >= 200 && m.status_code < 300).length;
            uptime = totalReqs > 0 ? ((successReqs / totalReqs) * 100).toFixed(2) : "99.99";

            // Count errors
            const errorsRes = await pool.query(
                'SELECT COUNT(*) FROM api_usage_logs WHERE status_code >= 400 AND created_at >= $1',
                [dayAgo]
            );
            errors = parseInt(errorsRes.rows[0].count);

            return NextResponse.json({
                stats: { totalChecks, uptime, errors },
                recentLogs
            });
        }

        return NextResponse.json({
            stats: { totalChecks, uptime, errors },
            recentLogs
        });
    } catch (error) {
        console.error('Failed to fetch admin stats:', error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
