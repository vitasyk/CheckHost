import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import pool, { isPostgresConfigured } from '@/lib/postgres';

const TIER_1 = ['US', 'GB', 'CA', 'AU', 'NZ', 'DE', 'SE', 'NO', 'FI', 'DK', 'CH'];
const TIER_2 = ['FR', 'IT', 'ES', 'PL', 'NL', 'BE', 'AT', 'IE', 'JP', 'SG'];

function getTier(countryCode: string): 'high' | 'medium' | 'low' {
    if (TIER_1.includes(countryCode)) return 'high';
    if (TIER_2.includes(countryCode)) return 'medium';
    return 'low';
}

function calculateTrend(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
}

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const timeRange = searchParams.get('timeRange') || '24h'; // 24h, 7d, 30d, all
    const toolFilter = searchParams.get('tool') || 'all'; // all, ping, dns, http, info

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        let totalChecks = 0;
        let totalChecksTrend = 0;
        let recentLogs: any[] = [];
        let uptime = "99.99";
        let errors = 0;
        let toolDistribution: any[] = [];
        let countryStats: any[] = [];
        let blogStats: any = { published: 0, draft: 0, keywordsPending: 0, keywordsCompleted: 0 };

        // Date calculations
        const now = new Date();
        let currentStartDate = new Date(0);
        let previousStartDate = new Date(0);
        let previousEndDate = new Date(0);

        if (timeRange === '24h') {
            currentStartDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            previousStartDate = new Date(currentStartDate.getTime() - 24 * 60 * 60 * 1000);
            previousEndDate = currentStartDate;
        } else if (timeRange === '7d') {
            currentStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            previousStartDate = new Date(currentStartDate.getTime() - 7 * 24 * 60 * 60 * 1000);
            previousEndDate = currentStartDate;
        } else if (timeRange === '30d') {
            currentStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            previousStartDate = new Date(currentStartDate.getTime() - 30 * 24 * 60 * 60 * 1000);
            previousEndDate = currentStartDate;
        }

        const currentStartIso = currentStartDate.toISOString();
        const prevStartIso = previousStartDate.toISOString();
        const prevEndIso = previousEndDate.toISOString();

        if (isSupabaseConfigured) {
            // Build base queries
            let querySbChecks = supabase.from('check_logs').select('*', { count: 'exact', head: true });
            const querySbLogs = supabase.from('check_logs').select('*').order('created_at', { ascending: false }).limit(10);
            let querySbDist = supabase.from('check_logs').select('check_type, user_country_code').order('created_at', { ascending: false }).limit(5000);
            let querySbPrevChecks = supabase.from('check_logs').select('*', { count: 'exact', head: true });
            let querySbPrevDist = supabase.from('check_logs').select('user_country_code').order('created_at', { ascending: false }).limit(5000); // Approximation

            // Apply Time Filters
            if (timeRange !== 'all') {
                querySbChecks = querySbChecks.gte('created_at', currentStartIso);
                querySbDist = querySbDist.gte('created_at', currentStartIso);
                querySbPrevChecks = querySbPrevChecks.gte('created_at', prevStartIso).lt('created_at', prevEndIso);
                querySbPrevDist = querySbPrevDist.gte('created_at', prevStartIso).lt('created_at', prevEndIso);
            }

            // Apply Tool Filters
            if (toolFilter !== 'all') {
                querySbDist = querySbDist.eq('check_type', toolFilter);
                querySbPrevDist = querySbPrevDist.eq('check_type', toolFilter);
                // Note: For total count, we might want to see filtered total or global total. Let's filter it.
                querySbChecks = querySbChecks.eq('check_type', toolFilter);
                querySbPrevChecks = querySbPrevChecks.eq('check_type', toolFilter);
            }

            // Execute Total Checks
            const { count: sbTotalChecks } = await querySbChecks;
            totalChecks = sbTotalChecks || 0;

            const { count: sbPrevTotalChecks } = await querySbPrevChecks;
            totalChecksTrend = calculateTrend(totalChecks, sbPrevTotalChecks || 0);

            // Execute Recent Logs
            const { data: sbRecentLogs } = await querySbLogs;
            recentLogs = sbRecentLogs || [];

            // Execute Distribution & Map Tiers/Trends
            const { data: recentForDist } = await querySbDist;
            const { data: prevForDist } = await querySbPrevDist;

            if (recentForDist) {
                const tools: Record<string, number> = {};
                const currentCountries: Record<string, number> = {};
                const prevCountries: Record<string, number> = {};

                // Current Period
                recentForDist.forEach((log: { check_type?: string, user_country_code?: string }) => {
                    const type = log.check_type || 'unknown';
                    tools[type] = (tools[type] || 0) + 1;

                    const country = log.user_country_code || 'Unknown';
                    currentCountries[country] = (currentCountries[country] || 0) + 1;
                });

                // Previous Period (for trends)
                if (prevForDist) {
                    prevForDist.forEach((log: { user_country_code?: string }) => {
                        const country = log.user_country_code || 'Unknown';
                        prevCountries[country] = (prevCountries[country] || 0) + 1;
                    });
                }

                toolDistribution = Object.entries(tools).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

                countryStats = Object.entries(currentCountries)
                    .map(([country, count]) => {
                        const prevCount = prevCountries[country] || 0;
                        return {
                            country,
                            count,
                            tier: getTier(country),
                            trend: calculateTrend(count, prevCount)
                        };
                    })
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 5);
            }

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

            // Blog Stats
            const { count: pubCount } = await supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'published');
            const { count: draftCount } = await supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'draft');
            const { count: kwPCount } = await supabase.from('blog_keywords').select('*', { count: 'exact', head: true }).eq('status', 'pending');
            const { count: kwCCount } = await supabase.from('blog_keywords').select('*', { count: 'exact', head: true }).eq('status', 'completed');

            blogStats = {
                published: pubCount || 0,
                draft: draftCount || 0,
                keywordsPending: kwPCount || 0,
                keywordsCompleted: kwCCount || 0
            };

            return NextResponse.json({
                stats: { totalChecks, uptime, errors },
                recentLogs,
                toolDistribution,
                countryStats,
                blogStats
            });
        }

        if (isPostgresConfigured) {
            // Build queries dynamically based on filters
            let timeFilterSql = '';
            let toolFilterSql = '';
            let prevTimeFilterSql = '';
            const params: any[] = [];
            let paramIndex = 1;

            if (timeRange !== 'all') {
                timeFilterSql = `created_at >= $${paramIndex}`;
                params.push(currentStartIso);
                paramIndex++;

                prevTimeFilterSql = `created_at >= $${paramIndex} AND created_at < $${paramIndex + 1}`;
                params.push(prevStartIso, prevEndIso);
                paramIndex += 2;
            }

            if (toolFilter !== 'all') {
                toolFilterSql = `check_type = $${paramIndex}`;
                params.push(toolFilter);
            }

            // Combine filters
            const buildWhere = (timeSql: string, toolSql: string) => {
                const parts = [];
                if (timeSql) parts.push(`(${timeSql})`);
                if (toolSql) parts.push(`(${toolSql})`);
                return parts.length > 0 ? `WHERE ${parts.join(' AND ')}` : '';
            };

            const currentWhere = buildWhere(timeFilterSql, toolFilterSql);
            const prevWhere = buildWhere(prevTimeFilterSql, toolFilterSql);

            // Total Checks & Trend
            const totalChecksRes = await pool.query(`SELECT COUNT(*) FROM check_logs ${currentWhere}`, params.slice(0, paramIndex));
            totalChecks = parseInt(totalChecksRes.rows[0].count);

            const prevChecksRes = await pool.query(`SELECT COUNT(*) FROM check_logs ${prevWhere}`, params.slice(0, paramIndex));
            const prevChecks = parseInt(prevChecksRes.rows[0].count);
            totalChecksTrend = calculateTrend(totalChecks, prevChecks);


            // Fetch recent logs
            const recentLogsRes = await pool.query(
                'SELECT * FROM check_logs ORDER BY created_at DESC LIMIT 10'
            );
            recentLogs = recentLogsRes.rows;

            // Tool Distribution
            const toolDistRes = await pool.query(`
                SELECT check_type as name, COUNT(*) as value 
                FROM check_logs 
                ${currentWhere}
                GROUP BY check_type 
                ORDER BY value DESC
            `, params.slice(0, paramIndex));
            toolDistribution = toolDistRes.rows;

            // Country Stats with Trends and Tiers
            const currentCountryRes = await pool.query(`
                SELECT COALESCE(user_country_code, 'Unknown') as country, COUNT(*) as count 
                FROM check_logs 
                ${currentWhere}
                GROUP BY user_country_code 
                ORDER BY count DESC 
                LIMIT 5
            `, params.slice(0, paramIndex));

            const prevCountryRes = await pool.query(`
                SELECT COALESCE(user_country_code, 'Unknown') as country, COUNT(*) as count 
                FROM check_logs 
                ${prevWhere}
                GROUP BY user_country_code
            `, params.slice(0, paramIndex));

            const prevCountryMap = new Map(prevCountryRes.rows.map(r => [r.country, parseInt(r.count)]));

            countryStats = currentCountryRes.rows.map(row => {
                const currentCount = parseInt(row.count);
                const prevCount = prevCountryMap.get(row.country) || 0;
                return {
                    country: row.country,
                    count: currentCount,
                    tier: getTier(row.country),
                    trend: calculateTrend(currentCount, prevCount)
                };
            });

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

            // Blog Stats
            const blogRes = await pool.query(`
                SELECT 
                    (SELECT COUNT(*) FROM posts WHERE status = 'published') as published,
                    (SELECT COUNT(*) FROM posts WHERE status = 'draft') as draft,
                    (SELECT COUNT(*) FROM blog_keywords WHERE status = 'pending') as pending_kw,
                    (SELECT COUNT(*) FROM blog_keywords WHERE status = 'completed') as completed_kw
            `);
            blogStats = {
                published: parseInt(blogRes.rows[0].published),
                draft: parseInt(blogRes.rows[0].draft),
                keywordsPending: parseInt(blogRes.rows[0].pending_kw),
                keywordsCompleted: parseInt(blogRes.rows[0].completed_kw)
            };

            return NextResponse.json({
                stats: { totalChecks, totalChecksTrend, uptime, errors },
                recentLogs,
                toolDistribution,
                countryStats,
                blogStats
            });
        }

        return NextResponse.json({
            stats: { totalChecks, totalChecksTrend, uptime, errors },
            recentLogs,
            toolDistribution,
            countryStats,
            blogStats
        });
    } catch (error) {
        console.error('Failed to fetch admin stats:', error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
