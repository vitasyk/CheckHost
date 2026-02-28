import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/postgres';
import { getToken } from 'next-auth/jwt';

export async function GET(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const result = await query(`
            SELECT * FROM docs_articles 
            ORDER BY section ASC, order_index ASC, created_at DESC
        `);
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('[Admin Docs API] GET error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { title, slug, content, section, order_index, published, cover_image } = body;

        if (!title || !slug || !content) {
            return NextResponse.json({ error: 'Title, slug and content are required' }, { status: 400 });
        }

        const result = await query(`
            INSERT INTO docs_articles (title, slug, content, section, order_index, published, cover_image)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `, [title, slug, content, section || 'General', order_index || 0, published || false, cover_image || null]);

        return NextResponse.json(result.rows[0]);
    } catch (error: any) {
        if (error.code === '23505') { // Unique violation
            return NextResponse.json({ error: 'Slug must be unique' }, { status: 400 });
        }
        console.error('[Admin Docs API] POST error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
