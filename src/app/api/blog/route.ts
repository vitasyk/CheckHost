import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Public endpoint to fetch published blog posts
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    try {
        if (slug) {
            const { data, error } = await supabase
                .from('posts')
                .select('*')
                .eq('slug', slug)
                .eq('status', 'published')
                .single();

            if (error) throw error;
            return NextResponse.json(data);
        } else {
            const { data, error } = await supabase
                .from('posts')
                .select('id, title, slug, excerpt, cover_image, author, published_at')
                .eq('status', 'published')
                .order('published_at', { ascending: false });

            if (error) throw error;
            return NextResponse.json(data);
        }
    } catch (error) {
        console.error('Failed to fetch public blog data:', error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}
