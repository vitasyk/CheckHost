
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
        await initDockerDbSchema();

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

    const updateClauses = keys
        .filter(k => k !== pk && k !== 'updated_at')
        .map(k => `${k} = EXCLUDED.${k}`);

    if (keys.includes('updated_at')) {
        updateClauses.push('updated_at = NOW()');
    }

    const updateString = updateClauses.join(', ');
    const onConflictClause = updateClauses.length > 0
        ? `DO UPDATE SET ${updateString}`
        : `DO NOTHING`;

    const query = `
        INSERT INTO ${table} (${keys.join(', ')})
        VALUES (${placeholders})
        ON CONFLICT (${pk}) ${onConflictClause}
    `;

    await pool.query(query, values);
}

/**
 * Ensures all necessary tables, types, and columns exist in the Docker Postgres
 * before attempting to sync data. This resolves "relation does not exist" errors
 * on fresh or outdated Docker volumes.
 */
async function initDockerDbSchema() {
    console.log('[DB Sync] Running pre-sync schema validation...');
    try {
        // 1. Types
        await pool.query(`
            DO $$ BEGIN
                CREATE TYPE monitor_type AS ENUM ('ssl', 'dns', 'blacklist', 'uptime');
            EXCEPTION WHEN duplicate_object THEN null; END $$;

            DO $$ BEGIN
                CREATE TYPE monitor_status AS ENUM ('ok', 'warning', 'error', 'pending');
            EXCEPTION WHEN duplicate_object THEN null; END $$;

            DO $$ BEGIN
                CREATE TYPE feed_event_type AS ENUM ('info', 'warning', 'success', 'error');
            EXCEPTION WHEN duplicate_object THEN null; END $$;
        `);

        // 2. Tables & Rename
        await pool.query(`
            -- Rename snapshots table if exists
            DO $$ BEGIN
                IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'result_snapshots') THEN
                    ALTER TABLE result_snapshots RENAME TO share_snapshots;
                    ALTER INDEX IF EXISTS idx_result_snapshots_expires_at RENAME TO idx_share_snapshots_expires_at;
                END IF;
            END $$;

            -- Admin Logs
            CREATE TABLE IF NOT EXISTS admin_audit_logs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                admin_email VARCHAR(255) NOT NULL,
                action VARCHAR(50) NOT NULL,
                entity_type VARCHAR(50) NOT NULL,
                entity_id VARCHAR(255),
                details JSONB,
                ip_address VARCHAR(45),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            -- Docs
            CREATE TABLE IF NOT EXISTS docs_articles (
                id SERIAL PRIMARY KEY,
                slug VARCHAR(255) UNIQUE NOT NULL,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                section VARCHAR(100) NOT NULL DEFAULT 'General',
                order_index INTEGER DEFAULT 0,
                published BOOLEAN DEFAULT false,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            -- Snapshots (if not already renamed)
            CREATE TABLE IF NOT EXISTS share_snapshots (
                id VARCHAR(12) PRIMARY KEY,
                check_type VARCHAR(20) NOT NULL,
                target_host TEXT NOT NULL,
                results JSONB NOT NULL,
                check_nodes JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP WITH TIME ZONE,
                metadata JSONB
            );

            -- Monitors
            CREATE TABLE IF NOT EXISTS user_monitors (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                domain VARCHAR(255) NOT NULL,
                type monitor_type NOT NULL,
                status monitor_status DEFAULT 'pending',
                last_check_at TIMESTAMP WITH TIME ZONE,
                next_check_at TIMESTAMP WITH TIME ZONE,
                meta JSONB DEFAULT '{}'::jsonb,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT true,
                UNIQUE(user_id, domain, type)
            );

            -- Feed
            CREATE TABLE IF NOT EXISTS user_activity_feed (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                monitor_id UUID REFERENCES user_monitors(id) ON DELETE SET NULL,
                event_type feed_event_type NOT NULL DEFAULT 'info',
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                is_read BOOLEAN DEFAULT false,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                meta JSONB DEFAULT '{}'::jsonb
            );

            -- Add columns to posts if missing
            DO $$ BEGIN
                IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'locale') THEN
                    ALTER TABLE posts ADD COLUMN locale VARCHAR(10) DEFAULT 'en';
                END IF;
                IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'translation_group') THEN
                    ALTER TABLE posts ADD COLUMN translation_group UUID;
                END IF;
            END $$;
        `);

        // 3. Indexes
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_email ON admin_audit_logs(admin_email);
            CREATE INDEX IF NOT EXISTS idx_docs_articles_slug ON docs_articles(slug);
            CREATE INDEX IF NOT EXISTS idx_share_snapshots_expires_at ON share_snapshots(expires_at);
            CREATE INDEX IF NOT EXISTS idx_user_monitors_user_id ON user_monitors(user_id);
            CREATE INDEX IF NOT EXISTS idx_user_feed_user_id_created ON user_activity_feed(user_id, created_at DESC);
        `);

        console.log('[DB Sync] Pre-sync schema validation successful.');
    } catch (error) {
        console.error('[DB Sync] Pre-sync schema validation failed:', error);
        // We don't throw here to allow sync to attempt to proceed if it was just a warning
    }
}
