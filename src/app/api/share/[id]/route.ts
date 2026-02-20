import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import pool, { isPostgresConfigured } from '@/lib/postgres';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
        }

        let snapshot: any = null;

        if (isPostgresConfigured) {
            const res = await pool.query(
                `SELECT * FROM result_snapshots WHERE id = $1`,
                [id]
            );
            if (res.rows.length > 0) {
                snapshot = res.rows[0];
            }
        } else if (isSupabaseConfigured) {
            const { data, error } = await supabase
                .from('result_snapshots')
                .select('*')
                .eq('id', id)
                .single();
            if (data) snapshot = data;
        }

        if (!snapshot) {
            return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 });
        }

        // Check for expiration
        if (snapshot.expires_at) {
            const expiresAt = new Date(snapshot.expires_at);
            if (expiresAt < new Date()) {
                // Optionally delete expired snapshot here (lazy cleanup)
                return NextResponse.json({ error: 'Snapshot expired' }, { status: 410 });
            }
        }

        return NextResponse.json(snapshot);

    } catch (error: any) {
        console.error('Error fetching snapshot:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
