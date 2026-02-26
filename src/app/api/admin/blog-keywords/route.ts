import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool, { isPostgresConfigured } from '@/lib/postgres';

// GET — list all keywords
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!isPostgresConfigured) return NextResponse.json([]);

    const { rows } = await pool.query(
        `SELECT id, keyword, status, language, created_at FROM blog_keywords ORDER BY created_at DESC LIMIT 500`
    );
    return NextResponse.json(rows);
}

// POST — bulk add keywords
export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!isPostgresConfigured) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

    const body = await request.json();
    const keywords: string[] = body.keywords || [];
    const language: string = body.language || 'en';

    if (!Array.isArray(keywords) || keywords.length === 0) {
        return NextResponse.json({ error: 'No keywords provided' }, { status: 400 });
    }

    let inserted = 0;
    for (const kw of keywords) {
        const trimmed = kw.trim();
        if (!trimmed) continue;
        try {
            await pool.query(
                `INSERT INTO blog_keywords (keyword, language) VALUES ($1, $2) ON CONFLICT (keyword) DO NOTHING`,
                [trimmed, language]
            );
            inserted++;
        } catch {
            // Skip duplicates / errors
        }
    }

    return NextResponse.json({ success: true, inserted });
}
