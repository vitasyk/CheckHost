import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import pool, { isPostgresConfigured } from '@/lib/postgres';
import { logAdminAction } from '@/lib/audit-logger';

/**
 * Handle GET request for all blog posts (Admin only)
 */
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        if (isSupabaseConfigured) {
            const { data, error } = await supabase
                .from('posts')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return NextResponse.json(data);
        }

        if (isPostgresConfigured) {
            const result = await pool.query(
                'SELECT * FROM posts ORDER BY created_at DESC'
            );
            return NextResponse.json(result.rows);
        }

        return NextResponse.json([]);
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

        if (isSupabaseConfigured) {
            const { data, error } = await supabase
                .from('posts')
                .insert([{
                    title,
                    slug,
                    excerpt,
                    content,
                    cover_image,
                    status,
                    ad_top: ad_top || false,
                    ad_bottom: ad_bottom || false,
                    published_at: status === 'published' ? new Date().toISOString() : null,
                    updated_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (error) throw error;

            // Audit Logging
            await logAdminAction({
                adminEmail: session.user?.email || 'unknown',
                action: 'CREATE_POST',
                entityType: 'post',
                entityId: data.id,
                details: { title: data.title, slug: data.slug },
                ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
            });

            return NextResponse.json(data);
        }

        if (isPostgresConfigured) {
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

            const post = result.rows[0];

            // Audit Logging
            await logAdminAction({
                adminEmail: session.user?.email || 'unknown',
                action: 'CREATE_POST',
                entityType: 'post',
                entityId: post.id,
                details: { title: post.title, slug: post.slug },
                ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
            });

            return NextResponse.json(post);
        }

        return NextResponse.json({ error: 'No database configured' }, { status: 500 });
    } catch (error) {
        console.error('Failed to create blog post:', error);
        return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
    }
}

/**
 * Handle DELETE request for bulk deletion (Admin only)
 */
export async function DELETE(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { ids } = await request.json();
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'Invalid or empty IDs array' }, { status: 400 });
        }

        if (isSupabaseConfigured) {
            const { error } = await supabase
                .from('posts')
                .delete()
                .in('id', ids);

            if (error) throw error;
        } else if (isPostgresConfigured) {
            await pool.query('DELETE FROM posts WHERE id = ANY($1)', [ids]);
        } else {
            return NextResponse.json({ error: 'No database configured' }, { status: 500 });
        }

        // Audit Logging
        await logAdminAction({
            adminEmail: session.user?.email || 'unknown',
            action: 'BULK_DELETE_POSTS',
            entityType: 'post',
            entityId: 'multiple',
            details: { count: ids.length, ids },
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
        });

        return NextResponse.json({ success: true, deletedCount: ids.length });
    } catch (error) {
        console.error('Failed to bulk delete posts:', error);
        return NextResponse.json({ error: 'Failed to bulk delete posts' }, { status: 500 });
    }
}
