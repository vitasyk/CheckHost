import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/postgres';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;

        const result = await query(
            'SELECT * FROM docs_articles WHERE slug = $1 AND published = true LIMIT 1',
            [slug]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Article not found' }, { status: 404 });
        }

        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error('[Docs API] Error fetching article by slug:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
