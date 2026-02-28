import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/postgres';
import { getToken } from 'next-auth/jwt';

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const body = await req.json();
        const { title, slug, content, section, order_index, published } = body;

        const result = await query(`
            UPDATE docs_articles 
            SET title = $1, slug = $2, content = $3, section = $4, order_index = $5, published = $6, updated_at = CURRENT_TIMESTAMP
            WHERE id = $7
            RETURNING *
        `, [title, slug, content, section, order_index, published, id]);

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Article not found' }, { status: 404 });
        }

        return NextResponse.json(result.rows[0]);
    } catch (error: any) {
        if (error.code === '23505') {
            return NextResponse.json({ error: 'Slug must be unique' }, { status: 400 });
        }
        console.error('[Admin Docs API] PUT error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const result = await query('DELETE FROM docs_articles WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Article not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Admin Docs API] DELETE error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
