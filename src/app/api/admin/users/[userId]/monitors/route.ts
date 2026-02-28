import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/postgres';

export async function GET(req: Request, { params }: { params: Promise<{ userId: string }> }) {
    try {
        const session = await getServerSession(authOptions);

        // Ensure only admins can access this route
        if (!session?.user?.id || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const resolvedParams = await params;
        const { userId } = resolvedParams;

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const res = await query(
            `SELECT id, domain, type, status, created_at, updated_at 
             FROM user_monitors 
             WHERE user_id = $1 AND is_active = true
             ORDER BY created_at DESC`,
            [userId]
        );

        return NextResponse.json({ data: res.rows });

    } catch (e: any) {
        console.error('[Admin User Monitors GET] Error:', e);
        return NextResponse.json({ error: 'Failed to retrieve user monitors' }, { status: 500 });
    }
}
