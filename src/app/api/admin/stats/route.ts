import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Fetch stats from Supabase
        const { count: totalChecks } = await supabase
            .from('check_logs')
            .select('*', { count: 'exact', head: true });

        const { data: recentLogs } = await supabase
            .from('check_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        // Calculate API Uptime (simplified: last 24h success rate)
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: apiMetrics } = await supabase
            .from('api_usage_logs')
            .select('status_code')
            .gte('created_at', dayAgo);

        const totalRequests = apiMetrics?.length || 0;
        const successRequests = apiMetrics?.filter(m => m.status_code >= 200 && m.status_code < 300).length || 0;
        const uptime = totalRequests > 0 ? (successRequests / totalRequests) * 100 : 99.99;

        // Count errors (last 24h)
        const { count: errors } = await supabase
            .from('api_usage_logs')
            .select('*', { count: 'exact', head: true })
            .gte('status_code', 400)
            .gte('created_at', dayAgo);

        return NextResponse.json({
            stats: {
                totalChecks: totalChecks || 0,
                uptime: uptime.toFixed(2),
                errors: errors || 0,
            },
            recentLogs: recentLogs || []
        });
    } catch (error) {
        console.error('Failed to fetch admin stats:', error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
