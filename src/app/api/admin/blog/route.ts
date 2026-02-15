import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

/**
 * Handle GET request for all blog posts (Admin only)
 */
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { data, error } = await supabase
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return NextResponse.json(data);
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
        return NextResponse.json(data);
    } catch (error) {
        console.error('Failed to create blog post:', error);
        return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
    }
}
