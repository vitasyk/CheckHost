import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/postgres';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const url = new URL(req.url);
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const offset = parseInt(url.searchParams.get('offset') || '0');

        // Fetch user's feed
        const res = await query(
            `SELECT * FROM user_activity_feed 
             WHERE user_id = $1 
             ORDER BY created_at DESC 
             LIMIT $2 OFFSET $3`,
            [session.user.id, limit, offset]
        );

        // Fetch total count for pagination
        const countRes = await query(
            `SELECT COUNT(*) as total FROM user_activity_feed WHERE user_id = $1`,
            [session.user.id]
        );

        return NextResponse.json({
            data: res.rows,
            total: parseInt(countRes.rows[0].total),
            page: Math.floor(offset / limit) + 1,
            totalPages: Math.ceil(parseInt(countRes.rows[0].total) / limit)
        });

    } catch (e: any) {
        console.error('[User Feed GET] Error:', e);
        return NextResponse.json({ error: 'Failed to retrieve feed' }, { status: 500 });
    }
}
