import { NextResponse } from 'next/server';
import pool from '@/lib/postgres';

/**
 * Public endpoint to fetch published blog posts
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    try {
        if (slug) {
            const result = await pool.query(
                `SELECT id, title, slug, excerpt, content, cover_image, author, published_at, ad_top, ad_bottom 
                 FROM posts 
                 WHERE slug = $1 AND status = 'published' LIMIT 1`,
                [slug]
            );

            if (result.rows.length === 0) {
                return NextResponse.json({ error: 'Post not found' }, { status: 404 });
            }
            return NextResponse.json(result.rows[0]);
        } else {
            const result = await pool.query(
                `SELECT id, title, slug, excerpt, cover_image, author, published_at 
                 FROM posts 
                 WHERE status = 'published' 
                 ORDER BY published_at DESC`
            );

            return NextResponse.json(result.rows);
        }
    } catch (error) {
        console.error('Failed to fetch public blog data:', error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}
