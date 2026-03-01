
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/postgres';
import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/lib/audit-logger';

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tables = ['site_settings', 'posts', 'admin_audit_logs'] } = await request.json();
    const results: any = {};

    try {
        for (const table of tables) {
            results[table] = await syncTable(table);
        }

        await logAdminAction({
            adminEmail: session.user?.email || 'unknown',
            action: 'DB_SYNC',
            entityType: 'database',
            entityId: 'all',
            details: { tables, results },
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
        });

        return NextResponse.json({ success: true, results });
    } catch (error: any) {
        console.error('Database Sync Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

async function syncTable(tableName: string) {
    // 1. Fetch from Postgres
    const pgRes = await pool.query(`SELECT * FROM ${tableName}`);
    const pgItems = pgRes.rows;

    // 2. Fetch from Supabase
    const { data: sbItems, error: sbError } = await supabase.from(tableName).select('*');
    if (sbError) throw new Error(`Supabase fetch error for ${tableName}: ${sbError.message}`);

    const stats = { pushedToSb: 0, pushedToPg: 0, skipped: 0 };
    const pgMap = new Map(pgItems.map((i: any) => [i.id || i.key, i]));
    const sbMap = new Map((sbItems || []).map((i: any) => [i.id || i.key, i]));

    const allKeys = new Set([...pgMap.keys(), ...sbMap.keys()]);

    for (const key of allKeys) {
        const pgItem = pgMap.get(key) as any;
        const sbItem = sbMap.get(key) as any;

        if (pgItem && sbItem) {
            // Compare timestamps if available
            const pgDate = new Date(pgItem.updated_at || pgItem.created_at || 0).getTime();
            const sbDate = new Date(sbItem.updated_at || sbItem.created_at || 0).getTime();

            if (pgDate > sbDate) {
                // Postgres is newer
                await supabase.from(tableName).upsert(pgItem);
                stats.pushedToSb++;
            } else if (sbDate > pgDate) {
                // Supabase is newer
                await upsertToPg(tableName, sbItem);
                stats.pushedToPg++;
            } else {
                stats.skipped++;
            }
        } else if (pgItem) {
            // Only in Postgres
            await supabase.from(tableName).upsert(pgItem);
            stats.pushedToSb++;
        } else if (sbItem) {
            // Only in Supabase
            await upsertToPg(tableName, sbItem);
            stats.pushedToPg++;
        }
    }

    return stats;
}

async function upsertToPg(table: string, item: any) {
    const pk = item.key ? 'key' : 'id';

    // Filter out 'id' if it's a 'key' based table and vice versa to avoid "column does not exist" errors
    const filteredItem = { ...item };
    if (pk === 'key' && filteredItem.id) delete filteredItem.id;
    if (pk === 'id' && filteredItem.key) delete filteredItem.key;

    const keys = Object.keys(filteredItem);
    const values = Object.values(filteredItem);
    const placeholders = keys.map((_, _i) => `$${_i + 1}`).join(', ');

    const updatePart = keys
        .filter(k => k !== pk && k !== 'updated_at')
        .map((k, _i) => `${k} = EXCLUDED.${k}`)
        .join(', ');

    const query = `
        INSERT INTO ${table} (${keys.join(', ')})
        VALUES (${placeholders})
        ON CONFLICT (${pk}) 
        DO UPDATE SET ${updatePart}${updatePart ? ', ' : ''}updated_at = NOW()
    `;

    await pool.query(query, values);
}
