import { NextResponse } from 'next/server';
import pool, { isPostgresConfigured } from '@/lib/postgres';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

/**
 * GET /api/cron/publish-blog-posts?secret=XXX&max=1
 *
 * Picks `max` draft posts that are oldest (most natural for SEO) and
 * marks them as published. Called by the tick orchestrator.
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const secretParam = searchParams.get('secret');
    const authHeader = request.headers.get('Authorization');
    const expectedSecret = process.env.CRON_SECRET;

    if (expectedSecret) {
        if (authHeader !== `Bearer ${expectedSecret}` && secretParam !== expectedSecret) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    } else if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 403 });
    }

    const max = Math.min(parseInt(searchParams.get('max') || '1', 10), 10);

    if (!isPostgresConfigured && !isSupabaseConfigured) {
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    try {
        let publishedSlugs: string[] = [];

        if (isPostgresConfigured) {
            // Pick the oldest `max` drafts
            const { rows } = await pool.query(
                `SELECT id, title, slug FROM posts WHERE status = 'draft' ORDER BY created_at ASC LIMIT $1`,
                [max]
            );

            if (rows.length === 0) {
                return NextResponse.json({ success: true, published: 0, message: 'No drafts to publish' });
            }

            const ids = rows.map((r: any) => r.id);
            await pool.query(
                `UPDATE posts SET status = 'published', published_at = NOW()
                 WHERE id = ANY($1::uuid[])`,
                [ids]
            );
            publishedSlugs = rows.map((r: any) => r.slug);
        } else if (isSupabaseConfigured) {
            const { data: drafts } = await supabase
                .from('posts')
                .select('id, title, slug')
                .eq('status', 'draft')
                .order('created_at', { ascending: true })
                .limit(max);

            if (!drafts || drafts.length === 0) {
                return NextResponse.json({ success: true, published: 0, message: 'No drafts to publish' });
            }

            const ids = drafts.map((r: any) => r.id);
            await supabase
                .from('posts')
                .update({ status: 'published', published_at: new Date().toISOString() })
                .in('id', ids);

            publishedSlugs = drafts.map((r: any) => r.slug);
        }

        console.log(`[AutoBlog] Published ${publishedSlugs.length} posts:`, publishedSlugs);

        return NextResponse.json({
            success: true,
            published: publishedSlugs.length,
            slugs: publishedSlugs,
        });
    } catch (error: any) {
        console.error('[AutoBlog] publish-blog-posts error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
