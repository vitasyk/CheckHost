import { NextResponse } from 'next/server';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import pool, { isPostgresConfigured } from '@/lib/postgres';

export const dynamic = 'force-dynamic';

export async function GET() {
    const health: any = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: {
            configured: false,
            provider: 'none',
            connected: false
        }
    };

    try {
        if (isSupabaseConfigured) {
            health.database.provider = 'supabase';
            health.database.configured = true;

            // Simple query to check connection
            const { error } = await supabase.from('site_settings').select('count', { count: 'exact', head: true });
            health.database.connected = !error;
            if (error) health.database.error = error.message;
        } else if (isPostgresConfigured) {
            health.database.provider = 'postgresql';
            health.database.configured = true;

            const client = await pool.connect();
            try {
                await client.query('SELECT 1');
                health.database.connected = true;
            } finally {
                client.release();
            }
        }
    } catch (error: any) {
        health.status = 'warning';
        health.database.connected = false;
        health.database.error = error.message;
    }

    const status = health.status === 'ok' ? 200 : 503;
    return NextResponse.json(health, { status });
}
