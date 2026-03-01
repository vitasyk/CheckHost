import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/postgres';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        // Ensure only admins can access this route
        if (!session?.user?.id || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const url = new URL(req.url);
        const limit = parseInt(url.searchParams.get('limit') || '50');
        const offset = parseInt(url.searchParams.get('offset') || '0');
        const search = url.searchParams.get('search') || '';

        // Build the query dynamically based on search presence
        let qs = `SELECT id, name, email, image, role, plan, created_at, last_login 
                  FROM users`;
        const queryParams: any[] = [];

        if (search) {
            qs += ` WHERE email ILIKE $1 OR name ILIKE $1`;
            queryParams.push(`%${search}%`);
            qs += ` ORDER BY created_at DESC LIMIT $2 OFFSET $3`;
            queryParams.push(limit, offset);
        } else {
            qs += ` ORDER BY created_at DESC LIMIT $1 OFFSET $2`;
            queryParams.push(limit, offset);
        }

        const res = await query(qs, queryParams);

        // Count query
        let countQs = `SELECT COUNT(*) as total FROM users`;
        const countParams: any[] = [];
        if (search) {
            countQs += ` WHERE email ILIKE $1 OR name ILIKE $1`;
            countParams.push(`%${search}%`);
        }

        const countRes = await query(countQs, countParams);

        return NextResponse.json({
            data: res.rows,
            total: parseInt(countRes.rows[0].total),
            page: Math.floor(offset / limit) + 1,
            totalPages: Math.ceil(parseInt(countRes.rows[0].total) / limit)
        });

    } catch (e: any) {
        console.error('[Admin Users GET] Error:', e);
        return NextResponse.json({ error: 'Failed to retrieve users' }, { status: 500 });
    }
}
