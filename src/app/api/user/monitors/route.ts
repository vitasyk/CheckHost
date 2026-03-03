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

        const res = await query(
            `SELECT * FROM user_monitors WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC`,
            [session.user.id]
        );

        return NextResponse.json({ data: res.rows });

    } catch (e: any) {
        console.error('[User Monitors GET] Error:', e);
        return NextResponse.json({ error: 'Failed to retrieve monitors' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { domain, type } = body;

        if (!domain || !type) {
            return NextResponse.json({ error: 'Missing domain or type' }, { status: 400 });
        }

        const validTypes = ['ssl', 'dns', 'blacklist', 'uptime', 'smtp'];
        if (!validTypes.includes(type)) {
            return NextResponse.json({ error: 'Invalid monitor type' }, { status: 400 });
        }

        // Clean domain
        const cleanDomain = domain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];

        // Ensure user hasn't exceeded limits (e.g. Free users get 3, premium get 20)
        // For now, implementing a basic check for free users: max 5 monitors total
        const countRes = await query(
            `SELECT COUNT(*) as total FROM user_monitors WHERE user_id = $1 AND is_active = true`,
            [session.user.id]
        );

        const currentMonitors = parseInt(countRes.rows[0].total);
        const MAX_FREE_MONITORS = 5;

        // Note: the plan checking logic depends on the token/session data.
        if (session.user.plan !== 'enterprise' && session.user.plan !== 'premium' && currentMonitors >= MAX_FREE_MONITORS) {
            return NextResponse.json({ error: `Free plan limit reached (${MAX_FREE_MONITORS} monitors). Please upgrade.` }, { status: 403 });
        }

        // Insert new monitor
        const res = await query(
            `INSERT INTO user_monitors (user_id, domain, type, status, meta) 
             VALUES ($1, $2, $3, 'pending', '{}'::jsonb) 
             ON CONFLICT (user_id, domain, type) 
             DO UPDATE SET is_active = true, updated_at = CURRENT_TIMESTAMP
             RETURNING id, domain, type, status`,
            [session.user.id, cleanDomain, type]
        );

        // Instantly generate a feed item for the new monitor
        await query(
            `INSERT INTO user_activity_feed (user_id, monitor_id, event_type, title, message)
             VALUES ($1, $2, 'info', $3, $4)`,
            [
                session.user.id,
                res.rows[0].id,
                'Monitor Added',
                `Successfully started ${type.toUpperCase()} monitoring for ${cleanDomain}.`
            ]
        );

        return NextResponse.json({ data: res.rows[0] });

    } catch (e: any) {
        console.error('[User Monitors POST] Error:', e);
        if (e.code === '23505') { // Unique violation
            return NextResponse.json({ error: 'Monitor already exists' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Failed to create monitor' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const url = new URL(req.url);
        const monitorId = url.searchParams.get('id');

        if (!monitorId) {
            return NextResponse.json({ error: 'Monitor ID required' }, { status: 400 });
        }

        // Soft delete
        const res = await query(
            `UPDATE user_monitors SET is_active = false, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $1 AND user_id = $2 RETURNING id`,
            [monitorId, session.user.id]
        );

        if (res.rows.length === 0) {
            return NextResponse.json({ error: 'Monitor not found or unauthorized' }, { status: 404 });
        }

        return NextResponse.json({ success: true });

    } catch (e: any) {
        console.error('[User Monitors DELETE] Error:', e);
        return NextResponse.json({ error: 'Failed to disable monitor' }, { status: 500 });
    }
}
