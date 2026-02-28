import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/postgres';

export async function GET(req: NextRequest) {
    try {
        // Get all published articles grouped by section
        const result = await query(`
            SELECT id, slug, title, section, order_index, created_at 
            FROM docs_articles 
            WHERE published = true 
            ORDER BY section ASC, order_index ASC
        `);

        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('[Docs API] Error fetching articles:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
