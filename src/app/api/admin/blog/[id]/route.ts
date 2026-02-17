import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/postgres';

/**
 * Handle GET request for single post (Admin only)
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const result = await pool.query(
            'SELECT * FROM posts WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }
        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error('Failed to fetch post:', error);
        return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
    }
}

/**
 * Handle PATCH request to update a blog post (Admin only)
 */
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { title, slug, excerpt, content, cover_image, status, ad_top, ad_bottom } = body;

        let published_at = body.published_at;
        if (status === 'published' && !published_at) {
            published_at = new Date().toISOString();
        }

        const result = await pool.query(
            `UPDATE posts 
             SET title = $1, slug = $2, excerpt = $3, content = $4, cover_image = $5, 
                 status = $6, ad_top = $7, ad_bottom = $8, published_at = $9, updated_at = NOW()
             WHERE id = $10
             RETURNING *`,
            [title, slug, excerpt, content, cover_image, status, ad_top, ad_bottom, published_at, id]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }
        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error('Failed to update post:', error);
        return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
    }
}

/**
 * Handle DELETE request to remove a post (Admin only)
 */
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await pool.query('DELETE FROM posts WHERE id = $1', [id]);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete post:', error);
        return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
    }
}
