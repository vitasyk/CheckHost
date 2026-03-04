import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import pool, { isPostgresConfigured } from '@/lib/postgres';
import crypto from 'crypto';

// Helper to generate a short ID
function generateShortId() {
    return crypto.randomBytes(4).toString('hex'); // 8 characters
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { type, host, results, checkNodes, metadata } = body;

        if (!type || !host || !results) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const id = generateShortId();

        // 1. Fetch TTL setting from site_settings (share_results key)
        let ttlDays = 30; // Default
        try {
            const { getSiteSetting } = await import('@/lib/site-settings');
            const shareConfig = await getSiteSetting('share_results');
            if (shareConfig && shareConfig.ttlDays !== undefined) {
                const parsed = Number(shareConfig.ttlDays);
                if (!isNaN(parsed)) {
                    ttlDays = parsed;
                }
            }
        } catch (err) {
            console.warn('Failed to fetch TTL setting, using default 30 days:', err);
        }

        // 2. Calculate expiration date
        let expiresAt: Date | null = null;
        if (ttlDays > 0) {
            expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + ttlDays);
        }

        // 3. Save snapshot to database
        if (isPostgresConfigured) {
            await pool.query(
                `INSERT INTO share_snapshots (id, check_type, target_host, results, check_nodes, expires_at, metadata)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [id, type, host, JSON.stringify(results), JSON.stringify(checkNodes), expiresAt, JSON.stringify(metadata)]
            );
        } else if (isSupabaseConfigured) {
            const { error } = await supabase
                .from('share_snapshots')
                .insert({
                    id,
                    check_type: type,
                    target_host: host,
                    results,
                    check_nodes: checkNodes,
                    expires_at: expiresAt?.toISOString(),
                    metadata
                });
            if (error) throw error;
        } else {
            return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
        }

        return NextResponse.json({
            id,
            url: `${process.env.NEXTAUTH_URL || ''}/share/${id}`,
            expiresAt: expiresAt?.toISOString() || null
        });

    } catch (error: any) {
        console.error('Error creating snapshot:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
