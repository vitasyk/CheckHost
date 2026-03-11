import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import pool, { isPostgresConfigured } from '@/lib/postgres';

export interface Snapshot {
    id: string;
    check_type: string;
    target_host: string;
    results: any;
    check_nodes: any;
    metadata: any;
    created_at: string;
    expires_at: string | null;
    isExpired?: boolean;
}

export async function getSnapshot(id: string): Promise<Snapshot | null> {
    if (!id) return null;

    let snapshot: any = null;

    if (isPostgresConfigured) {
        try {
            const res = await pool.query(
                `SELECT * FROM share_snapshots WHERE id = $1`,
                [id]
            );
            if (res.rows.length > 0) {
                snapshot = res.rows[0];
            }
        } catch (dbError) {
            console.error('[lib/snapshot] Postgres query failed:', dbError);
        }
    }

    if (!snapshot && isSupabaseConfigured) {
        try {
            const { data, error } = await supabase
                .from('share_snapshots')
                .select('*')
                .eq('id', id)
                .single();
            if (data) snapshot = data;
        } catch (sbError) {
            console.error('[lib/snapshot] Supabase query failed:', sbError);
        }
    }

    if (!snapshot) return null;

    // Check for expiration
    if (snapshot.expires_at) {
        const expiresAt = new Date(snapshot.expires_at);
        if (expiresAt < new Date()) {
            return { ...snapshot, isExpired: true };
        }
    }

    return snapshot;
}
