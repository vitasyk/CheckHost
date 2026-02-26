import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { createClient } from '@supabase/supabase-js';
import os from 'os';

// Postgres pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export async function GET() {
    const memTotal = os.totalmem();
    const memFree = os.freemem();
    const memUsed = memTotal - memFree;
    const memUsagePct = Math.round((memUsed / memTotal) * 100);

    const status: any = {
        database: {
            postgres: 'disconnected',
            supabase: 'disconnected',
        },
        server: {
            memory: {
                usage: memUsagePct,
                usedMB: Math.round(memUsed / 1024 / 1024),
                totalMB: Math.round(memTotal / 1024 / 1024),
            },
            uptime: process.uptime(),
            platform: `${os.platform()} ${os.arch()}`,
            nodeVersion: process.version,
            loadAvg: os.loadavg(),
        },
        timestamp: new Date().toISOString(),
    };

    // Check Postgres
    try {
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();
        status.database.postgres = 'connected';
    } catch {
        status.database.postgres = 'error';
    }

    // Check Supabase — only initialize if keys exist
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseKey) {
        try {
            const supabase = createClient(supabaseUrl, supabaseKey);
            const { error } = await supabase
                .from('site_settings')
                .select('key', { count: 'exact', head: true })
                .limit(1);
            status.database.supabase = error ? 'error' : 'connected';
        } catch {
            status.database.supabase = 'error';
        }
    } else {
        status.database.supabase = 'not configured';
    }

    return NextResponse.json(status);
}
