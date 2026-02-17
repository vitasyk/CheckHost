import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/postgres';

/**
 * Handle GET request for all blog posts (Admin only)
 */
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const result = await pool.query(
            'SELECT * FROM posts ORDER BY created_at DESC'
        );
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Failed to fetch blog posts:', error);
        return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }
}

/**
 * Handle POST request to create a new blog post (Admin only)
 */
export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { title, slug, excerpt, content, cover_image, status, ad_top, ad_bottom } = body;

        const result = await pool.query(
            `INSERT INTO posts (
                title, slug, excerpt, content, cover_image, status, ad_top, ad_bottom, published_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
            RETURNING *`,
            [
                title,
                slug,
                excerpt,
                content,
                cover_image,
                status,
                ad_top || false,
                ad_bottom || false,
                status === 'published' ? new Date().toISOString() : null
            ]
        );

        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error('Failed to create blog post:', error);
        return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
    }
}
