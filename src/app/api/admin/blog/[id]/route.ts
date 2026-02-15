import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

/**
 * Handle GET request for single post (Admin only)
 */
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { data, error } = await supabase
            .from('posts')
            .select('*')
            .eq('id', params.id)
            .single();

        if (error) throw error;
        return NextResponse.json(data);
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
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { title, slug, excerpt, content, cover_image, status, ad_top, ad_bottom } = body;

        const updateData: any = {
            title,
            slug,
            excerpt,
            content,
            cover_image,
            status,
            ad_top: ad_top ?? undefined,
            ad_bottom: ad_bottom ?? undefined,
            updated_at: new Date().toISOString()
        };

        if (status === 'published' && !body.published_at) {
            updateData.published_at = new Date().toISOString();
        }

        const { data, error } = await supabase
            .from('posts')
            .update(updateData)
            .eq('id', params.id)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);
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
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { error } = await supabase
            .from('posts')
            .delete()
            .eq('id', params.id);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete post:', error);
        return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
    }
}
