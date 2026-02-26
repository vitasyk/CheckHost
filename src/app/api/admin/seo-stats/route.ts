import { NextResponse } from 'next/server';
import pool, { isPostgresConfigured } from '@/lib/postgres';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// Helper to check authentication
async function isAuthenticated(_request: Request) {
    // Basic protection - checking cookies or headers like we do in other admin routes
    // For simplicity in this demo route, we assume middleware handles auth for /api/admin/*
    return true;
}

export async function GET(_request: Request) {
    try {
        if (!await isAuthenticated(_request)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let totalPages = 0;
        let recentPages = 0;

        // Try PostgreSQL first, fallback to Supabase
        if (isPostgresConfigured) {
            const totalResult = await pool.query('SELECT COUNT(*) as count FROM seo_pages');
            totalPages = parseInt(totalResult.rows[0].count);

            const recentResult = await pool.query(`
                SELECT COUNT(*) as count FROM seo_pages 
                WHERE last_checked >= NOW() - INTERVAL '24 hours'
            `);
            recentPages = parseInt(recentResult.rows[0].count);
        } else if (isSupabaseConfigured) {
            const { count: totalCount } = await supabase
                .from('seo_pages')
                .select('*', { count: 'exact', head: true });
            totalPages = totalCount || 0;

            const yesterday = new Date();
            yesterday.setHours(yesterday.getHours() - 24);
            const { count: recentCount } = await supabase
                .from('seo_pages')
                .select('*', { count: 'exact', head: true })
                .gte('last_checked', yesterday.toISOString());
            recentPages = recentCount || 0;
        } else {
            return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
        }

        return NextResponse.json({
            totalPages,
            recentPages,
            lastUpdate: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error fetching SEO stats:', error);
        return NextResponse.json({ error: 'Failed to fetch SEO stats' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        if (!await isAuthenticated(request)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { action } = await request.json();

        if (action === 'clear_old') {
            let deletedCount = 0;
            // Delete pages older than 30 days that have only been checked once (unpopular)
            if (isPostgresConfigured) {
                const result = await pool.query(`
                    DELETE FROM seo_pages 
                    WHERE check_count = 1 AND last_checked < NOW() - INTERVAL '30 days'
                `);
                deletedCount = result.rowCount || 0;
            } else if (isSupabaseConfigured) {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                const { data } = await supabase
                    .from('seo_pages')
                    .delete()
                    .eq('check_count', 1)
                    .lt('last_checked', thirtyDaysAgo.toISOString())
                    .select('id');
                deletedCount = data?.length || 0;
            }

            return NextResponse.json({ success: true, deletedCount });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Error in SEO admin action:', error);
        return NextResponse.json({ error: 'Action failed' }, { status: 500 });
    }
}
