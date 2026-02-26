import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool, { isPostgresConfigured } from '@/lib/postgres';

// DELETE — remove a keyword by id
export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!isPostgresConfigured) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

    const { id } = await params;

    await pool.query(`DELETE FROM blog_keywords WHERE id = $1`, [id]);

    return NextResponse.json({ success: true });
}
